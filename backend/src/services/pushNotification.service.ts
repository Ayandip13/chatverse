import { User, Notification } from '@/models';
import { NotificationStatus } from '@/constants/enums.constant';
import logger from '@/config/logger.config';
import axios from 'axios';
import { Types } from 'mongoose';

interface PushMessagePayload {
  to: string;
  sound?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

class PushNotificationService {
  /**
   * Send a push notification to a specific user by userId
   */
  public async sendPushNotification(
    userId: string | Types.ObjectId,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId).lean();
      if (!user) return false;

      // 1. Record in-app notification in DB
      await Notification.create({
        userId: new Types.ObjectId(userId.toString()),
        title,
        body,
        status: NotificationStatus.UNREAD,
        type: data?.type || 'GENERAL',
        actionUrl: data?.url || undefined,
      }).catch((err) => logger.error(`In-app notification creation failed: ${err.message}`));

      // 2. Check if user enabled notifications and has a valid Expo push token
      if (!user.expoPushToken || user.notificationPreference === false) {
        return false;
      }

      const token = user.expoPushToken.trim();
      if (!token.startsWith('ExponentPushToken') && !token.startsWith('ExpoPushToken')) {
        logger.warn(`Invalid Expo Push Token format for User ${userId}: ${token}`);
        return false;
      }

      const payload: PushMessagePayload = {
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
      };

      // 3. Dispatch to Expo Push Service
      const response = await axios.post('https://exp.host/--/api/v2/push/send', payload, {
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      logger.info(`Push notification sent to User ${userId} (${token}): ${JSON.stringify(response.data)}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send push notification to User ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  public async sendMulticastPushNotification(
    userIds: (string | Types.ObjectId)[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    await Promise.all(
      userIds.map((id) => this.sendPushNotification(id, title, body, data))
    );
  }
}

export const pushNotificationService = new PushNotificationService();
