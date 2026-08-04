import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name too long')
        .optional(),
      bio: z.string().max(500, 'Bio too long').optional(),
      avatar: z.string().url('Invalid avatar URL').optional(),
      phone: z.string().optional(),
      languagePreference: z.string().max(10).optional(),
      notificationPreference: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be updated',
    }),
});
