import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { authService } from '@/services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(STATUS_CODES.CREATED).json(new ApiResponse(result, 'Registration successful'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Login successful'));
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, role } = req.body;
  const result = await authService.googleLogin(idToken, role);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Google login successful'));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) {
    res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
    return;
  }
  const result = await authService.refresh(token);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Token refreshed'));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await authService.logout(req.user.userId);
  }
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Logged out successfully'));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Password reset email sent (if account exists)'));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Password has been reset'));
});
