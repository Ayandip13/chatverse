import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import mongoose from 'mongoose';

export const checkHealth = asyncHandler(async (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      {
        status: 'UP',
        timestamp: new Date().toISOString(),
        database: dbStatus,
      },
      'Service is running smoothly',
    ),
  );
});
