import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { settingsService } from '@/services/settings.service';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  res.status(STATUS_CODES.OK).json(new ApiResponse(settings, 'Settings retrieved successfully'));
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const updatedSettings = await settingsService.updateSettings(req.body);
  res
    .status(STATUS_CODES.OK)
    .json(new ApiResponse(updatedSettings, 'Settings updated successfully'));
});
