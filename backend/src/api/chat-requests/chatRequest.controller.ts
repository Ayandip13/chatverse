import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { chatRequestService } from '@/services/chatRequest.service';

export const sendRequest = asyncHandler(async (req: Request, res: Response) => {
  const { targetUserId } = req.body;
  const result = await chatRequestService.sendRequest(req.user!.userId, targetUserId);
  res.status(STATUS_CODES.CREATED).json(new ApiResponse(result, 'Chat request sent successfully'));
});

export const acceptRequest = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatRequestService.acceptRequest(req.user!.userId, req.params.id);
  res
    .status(STATUS_CODES.OK)
    .json(new ApiResponse(result, 'Chat request accepted and chat started'));
});

export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatRequestService.rejectRequest(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Chat request rejected'));
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatRequestService.cancelRequest(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Chat request cancelled'));
});

export const getRequests = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as any;
  const result = await chatRequestService.getRequests(
    req.user!.userId,
    req.user!.role as 'BOY' | 'GIRL',
    { status },
    parseInt(page, 10),
    parseInt(limit, 10),
  );

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: result.requests,
    message: 'Chat requests retrieved',
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    },
  });
});
