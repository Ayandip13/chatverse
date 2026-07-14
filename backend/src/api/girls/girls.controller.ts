import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { girlsService } from '@/services/girls.service';

export const getGirls = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as any;
  const result = await girlsService.discoverGirls(req.user!.userId, filters);
  
  res.status(STATUS_CODES.OK).json({
    success: true,
    data: result.girls,
    message: 'Girls retrieved successfully',
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    },
  });
});

export const getGirlDetails = asyncHandler(async (req: Request, res: Response) => {
  const girlId = req.params.id;
  const result = await girlsService.getGirlDetails(req.user!.userId, girlId);
  
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Girl details retrieved'));
});

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  const girlId = req.params.id;
  await girlsService.toggleFavorite(req.user!.userId, girlId, true);
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Added to favorites'));
});

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  const girlId = req.params.id;
  await girlsService.toggleFavorite(req.user!.userId, girlId, false);
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Removed from favorites'));
});
