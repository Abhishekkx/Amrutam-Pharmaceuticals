import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { correlationMiddleware } from './middlewares/correlation.middleware';
import { rateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { httpRequestCounter, httpRequestDurationHistogram } from './utils/metrics';
import healthRoutes from './routes/health.routes';
import apiRoutes from './routes/index';
import { NotFoundError } from './utils/errors';

export const createApp = (): Express => {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(cors({ origin: config.cors.origin }));

  // Body parsing & Correlation ID
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(correlationMiddleware);

  // Rate Limiter
  app.use(rateLimiter);

  // Prometheus Metrics tracking middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationSec = (Date.now() - start) / 1000;
      const route = req.route ? req.route.path : req.path;
      httpRequestCounter.inc({ method: req.method, route, status_code: res.statusCode });
      httpRequestDurationHistogram.observe({ method: req.method, route, status_code: res.statusCode }, durationSec);
    });
    next();
  });

  // Health and Metrics endpoints (unprefixed)
  app.use('/', healthRoutes);

  // API v1 routes
  app.use(config.apiPrefix, apiRoutes);

  // Catch 404
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
