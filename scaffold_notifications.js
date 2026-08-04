const fs = require("fs");
const path = require("path");

const backendDir = path.join(__dirname, "backend");

const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

mkDir(path.join(backendDir, "src/api/notifications"));
mkDir(path.join(backendDir, "src/validators"));
mkDir(path.join(backendDir, "src/services"));
mkDir(path.join(backendDir, "src/repositories"));

const files = {
  "src/validators/notification.validator.ts": `import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\\d+$/).optional().default('1'),
    limit: z.string().regex(/^\\d+$/).optional().default('20'),
  }),
});
`,
  "src/repositories/notification.repository.ts": `import { Notification } from '@/models';
import { INotification } from '@/types/models.type';
import { NotificationStatus } from '@/constants/enums.constant';
import { Types } from 'mongoose';

class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    return Notification.create(data);
  }

  async findById(id: string): Promise<INotification | null> {
    return Notification.findById(id).exec();
  }

  async getPaginatedNotifications(userId: string, page: number, limit: number) {
    const query = { userId: new Types.ObjectId(userId) };
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Notification.countDocuments(query).exec(),
    ]);

    return { notifications, total };
  }

  async markAsRead(id: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(id, { status: NotificationStatus.READ }, { new: true }).exec();
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId: new Types.ObjectId(userId), status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ }
    ).exec();
    return result.modifiedCount;
  }

  async delete(id: string): Promise<INotification | null> {
    return Notification.findByIdAndDelete(id).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId: new Types.ObjectId(userId), status: NotificationStatus.UNREAD }).exec();
  }
}

export const notificationRepository = new NotificationRepository();
`,
  "src/services/notification.service.ts": `import { notificationRepository } from '@/repositories/notification.repository';
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
      io.to(\`user:\${params.userId}\`).emit('notification:new', notification);
      
      // Update unread count strictly
      const unreadCount = await notificationRepository.getUnreadCount(params.userId);
      io.to(\`user:\${params.userId}\`).emit('notification:unread_count', { count: unreadCount });
    } catch (error) {
      logger.warn(\`Could not emit socket notification (Socket might not be initialized): \${(error as Error).message}\`);
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
      io.to(\`user:\${userId}\`).emit('notification:unread_count', { count });
    } catch (error) {
      // Socket not initialized, safely ignore
    }
  }
}

export const notificationService = new NotificationService();
`,
  "src/api/notifications/notification.controller.ts": `import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { notificationService } from '@/services/notification.service';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const result = await notificationService.getNotifications(
    req.user!.userId,
    parseInt(page, 10),
    parseInt(limit, 10)
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
  const notification = await notificationService.getNotificationDetails(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(notification, 'Notification details retrieved'));
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.markAsRead(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(notification, 'Notification marked as read'));
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.markAllAsRead(req.user!.userId);
  res.status(STATUS_CODES.OK).json(new ApiResponse({ updatedCount: count }, 'All notifications marked as read'));
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.deleteNotification(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Notification deleted successfully'));
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user!.userId);
  res.status(STATUS_CODES.OK).json(new ApiResponse({ count }, 'Unread count retrieved'));
});
`,
  "src/api/notifications/notification.route.ts": `import { Router } from 'express';
import * as notificationController from './notification.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth } from '@/middlewares/auth.middleware';
import { getNotificationsQuerySchema } from '@/validators/notification.validator';

const router = Router();

// Notice: In the future, if you want Admin notifications (which are tied to Admin accounts), 
// you can apply requireAdminAuth. For now, this handles all standard Users (Boy/Girl).
router.use(requireAuth);

router.get('/', validate(getNotificationsQuerySchema), notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/read-all', notificationController.markAllAsRead);
router.get('/:id', notificationController.getNotificationDetails);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, "utf8");
}
console.log("Notification scaffolding complete.");
