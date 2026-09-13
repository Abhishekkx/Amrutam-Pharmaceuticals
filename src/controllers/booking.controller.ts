import { Response } from 'express';
import { CustomRequest } from '../middlewares/correlation.middleware';
import { bookingService } from '../services/booking.service';
import { asyncHandler } from '../utils/asyncHandler';

export class BookingController {
  public bookConsultation = asyncHandler(async (req: CustomRequest, res: Response) => {
    const consultation = await bookingService.bookConsultation(
      req.user!.userId,
      req.body.slotId,
      req.correlationId,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully',
      data: consultation,
    });
  });
}

export const bookingController = new BookingController();
