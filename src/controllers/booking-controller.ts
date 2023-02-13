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
    const { roomId } = req.body;

    if (!roomId){
        res.sendStatus(httpStatus.NOT_FOUND);
        return;
    }

    try {
        const booking = await bookingService.postBookingByRoomId(Number(userId), Number(roomId));
        res.status(httpStatus.OK).send({
            bookingId:booking.id,
        });
        return;
    } catch (error) {
        if (error.name === "NotFoundError"){
            res.sendStatus(httpStatus.NOT_FOUND);
            return;
        }
        res.sendStatus(httpStatus.FORBIDDEN);
        return;
    }  
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const { roomId } = req.body;
    const bookingId = Number(req.params.bookingId);

    if (!roomId){
        res.sendStatus(httpStatus.NOT_FOUND);
        return;
    }

    if(!bookingId){
        res.sendStatus(httpStatus.FORBIDDEN);
        return;
    }

    try {
        const booking = await bookingService.putBooking(Number(userId), Number(roomId));
        res.status(httpStatus.OK).send({
            bookingId:booking.id,
        });
        return;
    } catch (error) {
        if (error.name === "NotFoundError"){
            res.sendStatus(httpStatus.NOT_FOUND);
            return;
        }
        res.sendStatus(httpStatus.FORBIDDEN);
        return;
    }
}
