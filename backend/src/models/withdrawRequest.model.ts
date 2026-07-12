import mongoose, { Schema } from 'mongoose';
import { IWithdrawRequest } from '@/types/models.type';
import { WithdrawStatus } from '@/constants/enums.constant';

const WithdrawRequestSchema = new Schema<IWithdrawRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    upiId: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(WithdrawStatus),
      default: WithdrawStatus.PENDING,
    },
    processedById: { type: Schema.Types.ObjectId, ref: 'Admin' },
    notes: { type: String },
  },
  { timestamps: true }
);

WithdrawRequestSchema.index({ userId: 1, status: 1 });
WithdrawRequestSchema.index({ status: 1, createdAt: 1 });

export const WithdrawRequest = mongoose.model<IWithdrawRequest>(
  'WithdrawRequest',
  WithdrawRequestSchema
);
