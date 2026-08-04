import { z } from 'zod';

export const getGirlsQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 20)),
    search: z.string().optional(),
    sort: z.string().optional(),
    online: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    favorites: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    rating: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : undefined)),
    recentlyJoined: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    recommended: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    popular: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  }),
});
