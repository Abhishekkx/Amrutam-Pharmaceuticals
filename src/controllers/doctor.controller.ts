import { Response } from 'express';
import { CustomRequest } from '../middlewares/correlation.middleware';
import { doctorService } from '../services/doctor.service';
import { asyncHandler } from '../utils/asyncHandler';

export class DoctorController {
  public createProfile = asyncHandler(async (req: CustomRequest, res: Response) => {
    const doctor = await doctorService.createDoctorProfile(req.user!.userId, req.body);
    res.status(201).json({
      success: true,
      data: doctor,
    });
  });

  public getDoctorById = asyncHandler(async (req: CustomRequest, res: Response) => {
    const doctor = await doctorService.getDoctorById(req.params.id);
    res.status(200).json({
      success: true,
      data: doctor,
    });
  });

  public searchDoctors = asyncHandler(async (req: CustomRequest, res: Response) => {
    const filter = req.query as any;
    const doctors = await doctorService.searchDoctors(filter);
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  });

  public createSlot = asyncHandler(async (req: CustomRequest, res: Response) => {
    const slot = await doctorService.createAvailabilitySlot(req.user!.userId, req.body);
    res.status(201).json({
      success: true,
      data: slot,
    });
  });

  public getSlots = asyncHandler(async (req: CustomRequest, res: Response) => {
    const slots = await doctorService.getDoctorSlots(req.params.id);
    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  });
}

export const doctorController = new DoctorController();
