import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '../constants/enums';

const router = Router();

router.get('/dashboard', authenticate, authorize(Role.ADMIN), analyticsController.getDashboard);

export default router;
