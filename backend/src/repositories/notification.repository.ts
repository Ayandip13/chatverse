import { Notification } from '@/models';
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
