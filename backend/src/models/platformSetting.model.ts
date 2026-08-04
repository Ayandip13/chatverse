import mongoose, { Schema } from 'mongoose';
import { IPlatformSetting } from '@/types/models.type';

const PlatformSettingSchema = new Schema<IPlatformSetting>(
  {
    commissionPercentage: { type: Number, required: true, min: 0, max: 100, default: 20 },
    coinConversionRate: { type: Number, required: true, default: 1 },
    coinsPerMinute: { type: Number, required: true, default: 10 },
    minimumWithdrawalAmount: { type: Number, required: true, default: 500 },
    maximumRechargeAmount: { type: Number, required: true, default: 100000 },
    isMaintenanceMode: { type: Boolean, required: true, default: false },
    isRegistrationEnabled: { type: Boolean, required: true, default: true },
    isGirlRegistrationEnabled: { type: Boolean, required: true, default: true },
    isBoyRegistrationEnabled: { type: Boolean, required: true, default: true },
    isGoogleLoginEnabled: { type: Boolean, required: true, default: true },
    isRazorpayEnabled: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export const PlatformSetting = mongoose.model<IPlatformSetting>(
  'PlatformSetting',
  PlatformSettingSchema,
);
