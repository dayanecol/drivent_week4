import { notFoundError } from "@/errors";
import { forbiddenError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import roomRepository from "@/repositories/room-repository";

async function getBooking(userId:number) {

    const booking = await bookingRepository.findBookingByUserId(userId);
    
    if(!booking){
        throw notFoundError();
    }

    return booking;
}

async function postBookingByRoomId(userId:number,roomId:number) {
    const room = await roomRepository.findRoomById(roomId);
    if (!room){
        throw notFoundError();
    }

    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) {
        throw forbiddenError();
    }
    
    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
    if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
        throw forbiddenError();
    }
    
    const booking = await bookingRepository.findBookingByRoomId(roomId);

    if(room.capacity <= booking.length){
        throw forbiddenError();
    }

    return bookingRepository.createBooking(userId,roomId);
}

async function putBooking(userId:number, roomId:number) {
    const room = await roomRepository.findRoomById(roomId);
    if (!room){
        throw notFoundError();
    }
    const booking = await bookingRepository.findBookingByRoomId(roomId);

    if(room.capacity <= booking.length){
        throw forbiddenError();
    }

    const bookingWithUserId = await bookingRepository.findBookingByUserId(userId);

    if(!bookingWithUserId || bookingWithUserId.userId !== userId){
        throw forbiddenError();
    }

    return bookingRepository.upsertBooking(bookingWithUserId.id, userId, roomId); 
}

const bookingService = {
    getBooking,
    postBookingByRoomId,
    putBooking,
}

export default bookingService;