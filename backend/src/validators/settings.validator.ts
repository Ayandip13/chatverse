import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    commissionPercentage: z.number().min(0).max(100).optional(),
    coinConversionRate: z.number().min(0.01).optional(),
    coinsPerMinute: z.number().min(1).optional(),
    minimumWithdrawalAmount: z.number().min(1).optional(),
    maximumRechargeAmount: z.number().min(1).optional(),
    isMaintenanceMode: z.boolean().optional(),
    isRegistrationEnabled: z.boolean().optional(),
    isGirlRegistrationEnabled: z.boolean().optional(),
    isBoyRegistrationEnabled: z.boolean().optional(),
    isGoogleLoginEnabled: z.boolean().optional(),
    isRazorpayEnabled: z.boolean().optional(),
  }),
});
