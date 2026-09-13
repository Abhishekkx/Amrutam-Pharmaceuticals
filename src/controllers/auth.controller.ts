import { Response } from 'express';
import { CustomRequest } from '../middlewares/correlation.middleware';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
  public register = asyncHandler(async (req: CustomRequest, res: Response) => {
    const result = await authService.register(req.body, req.correlationId, req.ip);
    res.status(201).json({
      success: true,
      data: result,
    });
  });

  public login = asyncHandler(async (req: CustomRequest, res: Response) => {
    const result = await authService.login(req.body, req.correlationId, req.ip);
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

export const authController = new AuthController();
