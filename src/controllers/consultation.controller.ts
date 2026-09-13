import { Response } from 'express';
import { CustomRequest } from '../middlewares/correlation.middleware';
import { consultationService } from '../services/consultation.service';
import { asyncHandler } from '../utils/asyncHandler';

export class ConsultationController {
  public getConsultation = asyncHandler(async (req: CustomRequest, res: Response) => {
    const consultation = await consultationService.getConsultation(req.params.id, req.user!);
    res.status(200).json({
      success: true,
      data: consultation,
    });
  });

  public getMyConsultations = asyncHandler(async (req: CustomRequest, res: Response) => {
    const consultations = await consultationService.getUserConsultations(req.user!);
    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations,
    });
  });

  public updateStatus = asyncHandler(async (req: CustomRequest, res: Response) => {
    const updated = await consultationService.updateStatus(
      req.params.id,
      req.body.status,
      req.body.notes,
      req.user!,
      req.correlationId,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: `Consultation status updated to ${req.body.status}`,
      data: updated,
    });
  });
}

export const consultationController = new ConsultationController();
