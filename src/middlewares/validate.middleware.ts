import { Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { CustomRequest } from './correlation.middleware';
import { BadRequestError } from '../utils/errors';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(new BadRequestError('Validation failed', formattedErrors));
      }
      next(error);
    }
  };
};
