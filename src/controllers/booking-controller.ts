import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";
import bookingService from "@/services/booking-service";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
    const { userId }= req;
    try {
        const booking = await bookingService.getBooking(userId);
        res.status(httpStatus.OK).send({
            id:booking.id,
            Room:booking.Room
        });
        return;
    } catch (error) {
        res.sendStatus(httpStatus.NOT_FOUND);
        return;
    }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const roomId = req.body.roomId as number;

    if (!roomId){
        res.sendStatus(httpStatus.BAD_REQUEST);
        return;
    }

    try {
        const booking = await bookingService.postBookingByRoomId(userId,roomId);
        res.status(httpStatus.OK).send({
            bookingId:booking.id,
        });
        return;
    } catch (error) {
        if (error.name === "Forbidden"){
            res.sendStatus(httpStatus.FORBIDDEN);
            return;
        }
        res.sendStatus(httpStatus.NOT_FOUND);
        return;
    }
    
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {}
