import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createEnrollmentWithAddress,
        createUser, 
        createTicket,
        createTicketTypeWithHotel,
        createPayment,
        createHotel,
        createRoomWithHotelId,
        createBooking,
        createBody,
        createTicketTypeRemote,
        createTicketTypeWithNoHotel   
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
              });  
        });
    });
  });


describe("POST /booking", () => {

    it("should respond with status 401 if no token is given", async () => {
      const createdValidBody = await createBody(1);
      const response = await server.post("/booking").send(createdValidBody);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {

        const token = faker.lorem.word();
        const createdValidBody = await createBody(1);

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdValidBody);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
        const createdValidBody = await createBody(1);

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdValidBody);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {

      it("should respond with status 403 when user has no enrollment yet", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeWithHotel();
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(user.id,createdRoom.id);
        const createdValidBody = await createBody(createdBooking.roomId);
  
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdValidBody);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when user has no ticket yet", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(user.id,createdRoom.id);
        const createdValidBody = await createBody(createdBooking.roomId);
  
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdValidBody);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when user has no payment yet", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(user.id,createdRoom.id);
        const createdValidBody = await createBody(createdBooking.roomId);
  
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdValidBody);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when user ticket is remote", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeRemote();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(user.id,createdRoom.id);
        const createdValidBody = await createBody(createdBooking.roomId);
  
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdValidBody);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when user ticket doesnt include hotel", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithNoHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(user.id,createdRoom.id);
        const createdValidBody = await createBody(createdBooking.roomId);
  
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdValidBody);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when sent body is invalid", async ()=>{
          const user = await createUser();
          const token = await generateValidToken(user);
          const enrollment = await createEnrollmentWithAddress(user);
          const ticketType = await createTicketTypeWithHotel();
          const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
          await createPayment(ticket.id, ticketType.price);
          const createdHotel = await createHotel();
          const createdRoom = await createRoomWithHotelId(createdHotel.id);
          const createdBooking = await createBooking(user.id,createdRoom.id);

          const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({
            roomId: "a",
          });

          expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 404 when roomId doesnt exist", async ()=>{
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        await createBooking(user.id,createdRoom.id);
        const createdInvalidBody = await createBody(createdRoom.id+1);


        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdInvalidBody);

        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });

      it("should respond with status 403 when room doesnt have capacity", async ()=>{
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        await createBooking(user.id,createdRoom.id);
        await createBooking(user.id,createdRoom.id);
        const createdBooking = await createBooking(user.id,createdRoom.id);
        const createdValidBody = await createBody(createdBooking.roomId);
        
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdValidBody);

        expect(response.status).toEqual(httpStatus.FORBIDDEN);
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
          const createdValidBody = await createBody(createdBooking.roomId);

          const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(createdValidBody);

          expect(response.status).toEqual(httpStatus.OK);
      });

  });
});

describe("PUT /booking/:bookingId", () => {

  it("should respond with status 401 if no token is given", async () => {
    const createdValidBody = await createBody(1);
    const response = await server.put("/booking/1").send(createdValidBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {

      const token = faker.lorem.word();
      const createdValidBody = await createBody(1);

      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(createdValidBody);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
      
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
      const createdValidBody = await createBody(1);

      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(createdValidBody);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {

    it("should respond with status 403 when sent body is invalid", async ()=>{
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(user.id,createdRoom.id);
      

        const response = await server.put("/booking/:bookingId").set("Authorization", `Bearer ${token}`).send({
          roomId: "a",
        });

        expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 when roomId doesnt exist", async ()=>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const createdBooking = await createBooking(user.id,createdRoom.id);
      const createdInvalidBody = await createBody(createdRoom.id+1);


      const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(createdInvalidBody);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 when room doesnt have capacity", async ()=>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const createdNewRoom = await createRoomWithHotelId(createdHotel.id);
      
      await createBooking(user.id,createdNewRoom.id);
      await createBooking(user.id,createdNewRoom.id);
      const createdBooking = await createBooking(user.id,createdNewRoom.id);
      const createdValidBody = await createBody(createdNewRoom.id); 
      
      const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(createdValidBody);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when bookingId is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const createdBooking = await createBooking(user.id,createdRoom.id);
      

      const createdNewRoom = await createRoomWithHotelId(createdHotel.id);
      const createdValidBody = await createBody(createdNewRoom.id); 

      const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send(createdValidBody);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
  });

    it("should respond with status 403 when user has not a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const createdBooking = await createBooking(user.id,createdRoom.id);
      
      const createdValidBody = await createBody(createdRoom.id);
      
      const user2 = await createUser();
      const booking2 = await createBooking(user2.id,createdRoom.id);

      const response = await server.put(`/booking/${booking2.id}`).set("Authorization", `Bearer ${token}`).send(createdValidBody);

      expect(response.status).toEqual(httpStatus.OK);
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
        

        const createdNewRoom = await createRoomWithHotelId(createdHotel.id);
        const createdValidBody = await createBody(createdNewRoom.id); 

        const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(createdValidBody);

        expect(response.status).toEqual(httpStatus.OK);
    });

});
});