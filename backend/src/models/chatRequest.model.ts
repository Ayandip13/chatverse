import mongoose, { Schema } from 'mongoose';
import { IChatRequest } from '@/types/models.type';
import { ChatRequestStatus } from '@/constants/enums.constant';

const ChatRequestSchema = new Schema<IChatRequest>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(ChatRequestStatus),
      default: ChatRequestStatus.PENDING,
    },
  },
  { timestamps: true },
);

ChatRequestSchema.index({ senderId: 1, status: 1 });
ChatRequestSchema.index({ receiverId: 1, status: 1 });

export const ChatRequest = mongoose.model<IChatRequest>('ChatRequest', ChatRequestSchema);
