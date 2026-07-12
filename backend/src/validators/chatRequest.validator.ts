import { z } from 'zod';

export const sendChatRequestSchema = z.object({
  body: z.object({
    targetUserId: z.string().min(1, 'Target User ID is required'),
  }),
});

export const getRequestsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    status: z.string().optional(), // Can filter by PENDING, ACCEPTED, etc.
  }),
});
