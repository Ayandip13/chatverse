import { Schema, model, Document, Types } from 'mongoose';

export interface ISettlement extends Document {
  chatId: Types.ObjectId;
  boyId: Types.ObjectId;
  girlId: Types.ObjectId;
  completedMessages: number;
  grossCoins: number;
  platformCommissionCoins: number;
  girlEarningsCoins: number;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  settledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    boyId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    girlId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    completedMessages: { type: Number, default: 0, required: true },
    grossCoins: { type: Number, default: 0, required: true },
    platformCommissionCoins: { type: Number, default: 0, required: true },
    girlEarningsCoins: { type: Number, default: 0, required: true },
    status: {
      type: String,
      enum: ['COMPLETED', 'FAILED', 'PARTIAL'],
      default: 'COMPLETED',
      required: true,
    },
    settledAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Settlement = model<ISettlement>('Settlement', settlementSchema);
