import { prisma } from "@/config";

async function findBookingByUserId(userId:number){
    return prisma.booking.findFirst({
        where:{
            userId:userId,
        },
        include:{
            Room:true,
        }
    });
}

async function createBooking(){
    return;
}

async function upsertBooking(){
    return;
}

const bookingRepository = {
    findBookingByUserId,
    createBooking,
    upsertBooking,
}

export default bookingRepository;