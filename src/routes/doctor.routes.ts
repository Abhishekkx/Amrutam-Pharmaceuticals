import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createDoctorProfileSchema, createSlotSchema, searchDoctorSchema } from '../schemas/doctor.schema';
import { Role } from '../constants/enums';

const router = Router();

// Public / Search endpoints
router.get('/search', validateRequest(searchDoctorSchema), doctorController.searchDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/slots', doctorController.getSlots);

// Doctor protected endpoints
router.post('/profile', authenticate, authorize(Role.DOCTOR, Role.ADMIN), validateRequest(createDoctorProfileSchema), doctorController.createProfile);
router.post('/slots', authenticate, authorize(Role.DOCTOR, Role.ADMIN), validateRequest(createSlotSchema), doctorController.createSlot);

export default router;
