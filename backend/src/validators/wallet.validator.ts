import { z } from 'zod';
import { TransactionType } from '@/constants/enums.constant';

export const rechargeSchema = z.object({
  body: z.object({
    amountInr: z.number().min(1, 'Amount must be at least 1 INR'),
  }),
});

export const verifyRechargeSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1, 'Order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
    razorpaySignature: z.string().min(1, 'Signature is required'),
    amountInr: z.number().optional(),
  }),
});

export const transactionHistoryQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    type: z.nativeEnum(TransactionType).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
