import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface CustomRequest extends Request {
  correlationId?: string;
  user?: {
    userId: string;
    email: string;
    role: any;
  };
}

export const correlationMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};
