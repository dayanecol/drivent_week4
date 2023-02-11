import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";
import bookingService from "@/services/booking-service";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
    const { userId }= req;
    try {
        const booking = await bookingService.getBooking(userId);
        res.status(httpStatus.OK).send();
        return;
    } catch (error) {
        res.sendStatus(httpStatus.NOT_FOUND);
        return;
    }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {}

export async function putBooking(req: AuthenticatedRequest, res: Response) {}
