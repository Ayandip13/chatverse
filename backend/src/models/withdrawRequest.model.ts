import mongoose, { Schema } from 'mongoose';
import { IWithdrawRequest } from '@/types/models.type';
import { WithdrawStatus } from '@/constants/enums.constant';

const WithdrawRequestSchema = new Schema<IWithdrawRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      enum: ['UPI', 'BANK_TRANSFER'], 
      default: 'UPI',
      required: true 
    },
    upiId: { type: String },
    bankDetails: {
      accountName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
    },
    status: {
      type: String,
      enum: Object.values(WithdrawStatus),
      default: WithdrawStatus.PENDING,
      required: true,
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    reviewedById: { type: Schema.Types.ObjectId, ref: 'Admin' },
    reviewedAt: { type: Date },
    paidAt: { type: Date },
    rejectionReason: { type: String },
    transactionReference: { type: String },
    processedById: { type: Schema.Types.ObjectId, ref: 'Admin' },
    notes: { type: String },
  },
  { timestamps: true }
);

WithdrawRequestSchema.index({ userId: 1, status: 1 });
WithdrawRequestSchema.index({ status: 1, createdAt: -1 });

export const WithdrawRequest = mongoose.model<IWithdrawRequest>(
  'WithdrawRequest',
  WithdrawRequestSchema
);
