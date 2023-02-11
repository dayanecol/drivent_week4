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

async function findBookingByRoomId(roomId:number){
    return prisma.booking.findMany({
        where:{
            roomId:roomId,
        },
        include:{
            Room:true,
        }
    });
}

async function createBooking(userId:number, roomId:number){
    return prisma.booking.create({
        data:{
            userId:userId,
            roomId:roomId
        }
    });
}

async function upsertBooking(){
    return;
}

const bookingRepository = {
    findBookingByUserId,
    findBookingByRoomId,
    createBooking,
    upsertBooking,
}

export default bookingRepository;