import { Request, Response } from 'express';
import { prisma } from '../repositories/prisma';
import { metricsRegistry } from '../utils/metrics';

export class HealthController {
  public checkLiveness = (req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  };

  public checkReadiness = async (req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'READY',
        database: 'CONNECTED',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        status: 'NOT_READY',
        database: 'DISCONNECTED',
        error: error.message,
      });
    }
  };

  public getMetrics = async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', metricsRegistry.contentType);
      const metrics = await metricsRegistry.metrics();
      res.end(metrics);
    } catch (err: any) {
      res.status(500).end(err);
    }
  };
}

export const healthController = new HealthController();
