import mongoose, { Schema } from 'mongoose';
import { IWallet } from '@/types/models.type';

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentBalance: { type: Number, default: 0 },
    lifetimeRecharge: { type: Number, default: 0 },
    lifetimeEarnings: { type: Number, default: 0 },
    lifetimeSpent: { type: Number, default: 0 },
    lifetimeWithdraw: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WalletSchema.index({ userId: 1 }, { unique: true });

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
