import { z } from 'zod';

export const createRatingSchema = z.object({
  body: z.object({
    targetUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid chat ID'),
    score: z.number().min(1).max(5),
    review: z.string().max(500).optional(),
  }),
});

export const getRatingsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    targetUserId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')
      .optional(),
  }),
});
