import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { notificationService } from '@/services/notification.service';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const result = await notificationService.getNotifications(
    req.user!.userId,
    parseInt(page, 10),
    parseInt(limit, 10),
  );

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: result.notifications,
    message: 'Notifications retrieved',
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    },
  });
});

export const getNotificationDetails = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.getNotificationDetails(
    req.user!.userId,
    req.params.id,
  );
  res.status(STATUS_CODES.OK).json(new ApiResponse(notification, 'Notification details retrieved'));
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.markAsRead(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(notification, 'Notification marked as read'));
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.markAllAsRead(req.user!.userId);
  res
    .status(STATUS_CODES.OK)
    .json(new ApiResponse({ updatedCount: count }, 'All notifications marked as read'));
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.deleteNotification(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Notification deleted successfully'));
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user!.userId);
  res.status(STATUS_CODES.OK).json(new ApiResponse({ count }, 'Unread count retrieved'));
});
