import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createEnrollmentWithAddress,
        createUser, 
        createTicketType, 
        createTicket,
        createTicketTypeWithHotel,
        createPayment,
        createHotel,
        createRoomWithHotelId,
        createBooking    
    } from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
    it("should respond with status 401 if no token is given", async () => {

        const response = await server.get("/booking");
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if given token is not valid", async () => {

        const token = faker.lorem.word();
  
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if there is no session for given token", async () => {
        
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    describe("when token is valid", () => {

  
        it("should respond with status 404 when user doesnt have a booking yet", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            await createRoomWithHotelId(createdHotel.id);

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });
      
      
        it("should respond with status 200 when user has a booking", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            const createdBooking = await createBooking(user.id,createdRoom.id);

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual({
                id: createdBooking.id,
                Room: {
                  id: createdBooking.roomId,
                  name: expect.any(String),
                  capacity: expect.any(Number),
                  hotelId: expect.any(Number),
                  createdAt: expect.any(String),
                  updatedAt: expect.any(String),
                }
              })
            
            
        });

    });
  });