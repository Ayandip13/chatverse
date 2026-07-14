import { z } from 'zod';

export const requestWithdrawalSchema = z.object({
  body: z.object({
    amount: z.number().positive().min(100, 'Minimum withdrawal is 100'),
    upiId: z.string().min(5, 'Invalid UPI ID'),
  }),
});

export const getWithdrawalsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']).optional(),
  }),
});
