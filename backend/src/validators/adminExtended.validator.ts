import { z } from 'zod';
import { WithdrawStatus } from '@/constants/enums.constant';

export const getChatsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const getTransactionsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    type: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const getWithdrawalsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    status: z.nativeEnum(WithdrawStatus).optional(),
  }),
});

export const updateWithdrawalSchema = z.object({
  body: z.object({
    status: z.nativeEnum(WithdrawStatus),
    notes: z.string().optional(),
  }),
});
