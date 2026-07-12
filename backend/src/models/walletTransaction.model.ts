import mongoose, { Schema } from 'mongoose';
import { IWalletTransaction } from '@/types/models.type';
import { TransactionType } from '@/constants/enums.constant';

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, type: 1 });

export const WalletTransaction = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  WalletTransactionSchema
);
