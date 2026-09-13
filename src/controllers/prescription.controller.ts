import { Response } from 'express';
import { CustomRequest } from '../middlewares/correlation.middleware';
import { prescriptionService } from '../services/prescription.service';
import { asyncHandler } from '../utils/asyncHandler';

export class PrescriptionController {
  public createPrescription = asyncHandler(async (req: CustomRequest, res: Response) => {
    const prescription = await prescriptionService.createPrescription(
      req.user!.userId,
      req.body,
      req.correlationId,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Prescription issued successfully',
      data: prescription,
    });
  });

  public getByConsultation = asyncHandler(async (req: CustomRequest, res: Response) => {
    const prescription = await prescriptionService.getPrescriptionByConsultation(req.params.consultationId, req.user!);
    res.status(200).json({
      success: true,
      data: prescription,
    });
  });

  public getMyPrescriptions = asyncHandler(async (req: CustomRequest, res: Response) => {
    const prescriptions = await prescriptionService.getPatientPrescriptions(req.user!.userId);
    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  });
}

export const prescriptionController = new PrescriptionController();
