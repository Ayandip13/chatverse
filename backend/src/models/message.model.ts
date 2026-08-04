import mongoose, { Schema } from 'mongoose';
import { IMessage } from '@/types/models.type';

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

MessageSchema.index({ chatId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
