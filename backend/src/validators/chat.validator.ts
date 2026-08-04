import { z } from 'zod';
import { ChatStatus } from '@/constants/enums.constant';

export const getChatsQuerySchema = z.object({
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
    status: z.nativeEnum(ChatStatus).optional(),
    unread: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  }),
});

export const getMessagesQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 50)),
  }),
});
