import { Response, NextFunction } from 'express';
import { CustomRequest } from './correlation.middleware';
import { redisService } from '../services/redis.service';
import { IdempotencyConflictError } from '../utils/errors';
import { logger } from '../utils/logger';

export const idempotencyMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  if (!idempotencyKey) {
    return next();
  }

  const cacheKey = `idempotency:${idempotencyKey}`;

  try {
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      if (cachedData === 'PROCESSING') {
        throw new IdempotencyConflictError('A request with this idempotency key is currently being processed');
      }

      logger.info(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
      const parsed = JSON.parse(cachedData);
      return res.status(parsed.statusCode).json(parsed.body);
    }

    await redisService.set(cacheKey, 'PROCESSING', 60);

    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      const responseToCache = {
        statusCode: res.statusCode,
        body,
      };

      redisService.set(cacheKey, JSON.stringify(responseToCache), 86400).catch((err) => {
        logger.error(`[Idempotency] Error caching response for key ${idempotencyKey}: ${err.message}`);
      });

      return originalJson(body);
    };

    next();
  } catch (error) {
    next(error);
  }
};
