import mongoose, { Schema } from 'mongoose';
import { IRating } from '@/types/models.type';
import { RatingStatus } from '@/constants/enums.constant';

const RatingSchema = new Schema<IRating>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(RatingStatus),
      default: RatingStatus.ACTIVE,
    },
  },
  { timestamps: true },
);

RatingSchema.index({ chatId: 1, reviewerId: 1 }, { unique: true });
RatingSchema.index({ targetId: 1, status: 1 });

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
