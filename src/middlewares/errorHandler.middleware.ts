import { Response, NextFunction } from 'express';
import { CustomRequest } from './correlation.middleware';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  req: CustomRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const correlationId = req.correlationId;

  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      statusCode: err.statusCode,
      correlationId,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.constructor.name,
        message: err.message,
        details: err.details || null,
        correlationId,
      },
    });
  }

  // Unhandled internal server error
  logger.error(`Unhandled system error: ${err.message}`, {
    stack: err.stack,
    correlationId,
    path: req.path,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'InternalServerError',
      message: config.env === 'production' ? 'An unexpected internal error occurred' : err.message,
      correlationId,
    },
  });
};
