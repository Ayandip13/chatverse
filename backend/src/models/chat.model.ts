import mongoose, { Schema } from 'mongoose';
import { IChat } from '@/types/models.type';
import { ChatStatus } from '@/constants/enums.constant';

const ChatSchema = new Schema<IChat>(
  {
    boyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    girlId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chatRequestId: { type: Schema.Types.ObjectId, ref: 'ChatRequest', required: true },
    status: {
      type: String,
      enum: Object.values(ChatStatus),
      default: ChatStatus.ACTIVE,
    },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    durationInMinutes: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ChatSchema.index({ boyId: 1, status: 1 });
ChatSchema.index({ girlId: 1, status: 1 });

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);
