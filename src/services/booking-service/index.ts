import { notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";

async function getBooking(userId:number) {

    const booking = await bookingRepository.findBookingByUserId(userId);
    
    if(!booking){
        throw notFoundError();
    }

    return booking;
}

async function postBooking() {
    
}

async function putBooking() {
    
}

const bookingService = {
    getBooking,
    postBooking,
    putBooking,
}

export default bookingService;