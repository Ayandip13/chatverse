import mongoose, { Schema } from 'mongoose';
import { INotification } from '@/types/models.type';
import { NotificationStatus } from '@/constants/enums.constant';

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.UNREAD,
    },
    type: { type: String, required: true },
    actionUrl: { type: String },
  },
  { timestamps: true }
);

// TTL Index to automatically delete read or old notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
NotificationSchema.index({ userId: 1, status: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
