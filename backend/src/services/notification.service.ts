import { notificationRepository } from '@/repositories/notification.repository';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { NotificationStatus } from '@/constants/enums.constant';
import { getIO } from '@/sockets';
import logger from '@/config/logger.config';
import { Types } from 'mongoose';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: string;
  actionUrl?: string;
}

class NotificationService {
  async sendNotification(params: CreateNotificationParams) {
    // 1. Persist in database (so offline users see it when they open the app)
    const notification = await notificationRepository.create({
      userId: new Types.ObjectId(params.userId),
      title: params.title,
      body: params.body,
      type: params.type,
      actionUrl: params.actionUrl,
      status: NotificationStatus.UNREAD,
    });

    try {
      const io = getIO();
      // 2. Emit to recipient's personal room. If they are online, they get it instantly.
      // If offline, Socket.IO ignores it, but it's already persisted in the DB.
      io.to(`user:${params.userId}`).emit('notification:new', notification);

      // Update unread count strictly
      const unreadCount = await notificationRepository.getUnreadCount(params.userId);
      io.to(`user:${params.userId}`).emit('notification:unread_count', { count: unreadCount });
    } catch (error) {
      logger.warn(
        `Could not emit socket notification (Socket might not be initialized): ${(error as Error).message}`,
      );
    }

    return notification;
  }

  async getNotifications(userId: string, page: number, limit: number) {
    return await notificationRepository.getPaginatedNotifications(userId, page, limit);
  }

  async getNotificationDetails(userId: string, notificationId: string) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Notification not found', 'NOT_FOUND');
    }
    if (notification.userId.toString() !== userId) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'Unauthorized access', 'UNAUTHORIZED');
    }
    return notification;
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.getNotificationDetails(userId, notificationId);
    if (notification.status === NotificationStatus.READ) {
      return notification;
    }
    const updated = await notificationRepository.markAsRead(notificationId);

    this.broadcastUnreadCount(userId);
    return updated;
  }

  async markAllAsRead(userId: string) {
    const count = await notificationRepository.markAllAsRead(userId);
    this.broadcastUnreadCount(userId);
    return count;
  }

  async deleteNotification(userId: string, notificationId: string) {
    // Validation ensures ownership
    await this.getNotificationDetails(userId, notificationId);
    const deleted = await notificationRepository.delete(notificationId);

    this.broadcastUnreadCount(userId);
    return deleted;
  }

  async getUnreadCount(userId: string) {
    return await notificationRepository.getUnreadCount(userId);
  }

  private async broadcastUnreadCount(userId: string) {
    try {
      const io = getIO();
      const count = await notificationRepository.getUnreadCount(userId);
      io.to(`user:${userId}`).emit('notification:unread_count', { count });
    } catch (error) {
      // Socket not initialized, safely ignore
    }
  }
}

export const notificationService = new NotificationService();
