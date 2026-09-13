import { Router } from 'express';
import authRoutes from './auth.routes';
import doctorRoutes from './doctor.routes';
import bookingRoutes from './booking.routes';
import consultationRoutes from './consultation.routes';
import prescriptionRoutes from './prescription.routes';
import paymentRoutes from './payment.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/bookings', bookingRoutes);
router.use('/consultations', consultationRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/payments', paymentRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
