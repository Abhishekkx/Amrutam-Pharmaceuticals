import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

router.get('/health', healthController.checkLiveness);
router.get('/ready', healthController.checkReadiness);
router.get('/metrics', healthController.getMetrics);

export default router;
