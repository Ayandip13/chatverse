import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { chatService } from '../../services/chat.service';

export const getChats = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as any;
  const result = await chatService.getChats(req.user!.userId, filters);

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: result.chats,
    message: 'Chats retrieved successfully',
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    },
  });
});

export const getChatDetails = asyncHandler(async (req: Request, res: Response) => {
  const chatId = req.params.id;
  const result = await chatService.getChatDetails(req.user!.userId, chatId);

  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Chat details retrieved'));
});

export const getChatMessages = asyncHandler(async (req: Request, res: Response) => {
  const chatId = req.params.id;
  const filters = req.query as any;
  const result = await chatService.getChatMessages(req.user!.userId, chatId, filters);

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: result.messages,
    message: 'Messages retrieved',
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    },
  });
});

export const endChat = asyncHandler(async (req: Request, res: Response) => {
  const chatId = req.params.id;
  await chatService.endChat(req.user!.userId, chatId);

  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Chat ended successfully'));
});
