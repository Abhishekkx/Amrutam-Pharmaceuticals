import { Response } from 'express';
import { CustomRequest } from '../middlewares/correlation.middleware';
import { analyticsService } from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';

export class AnalyticsController {
  public getDashboard = asyncHandler(async (req: CustomRequest, res: Response) => {
    const metrics = await analyticsService.getDashboardMetrics();
    res.status(200).json({
      success: true,
      data: metrics,
    });
  });
}

export const analyticsController = new AnalyticsController();
