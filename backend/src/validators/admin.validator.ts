import { z } from 'zod';
import { BoyStatus, GirlStatus, Role } from '@/constants/enums.constant';

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.union([
      z.nativeEnum(BoyStatus),
      z.nativeEnum(GirlStatus)
    ]),
    reason: z.string().optional(),
  }),
});

export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    role: z.nativeEnum(Role).optional(),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
});
