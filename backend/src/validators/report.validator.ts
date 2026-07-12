import { z } from 'zod';
import { ReportStatus } from '@/constants/enums.constant';

export const createReportSchema = z.object({
  body: z.object({
    targetId: z.string().min(1, 'Target User ID is required'),
    reason: z.string().min(1, 'Reason is required'),
    notes: z.string().optional(),
    evidence: z.string().optional(), // Could be URL or serialized chat ID
  }),
});

export const getReportsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    status: z.nativeEnum(ReportStatus).optional(),
    targetId: z.string().optional(),
  }),
});

export const updateReportStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ReportStatus),
    notes: z.string().optional(), // Resolution notes
  }),
});
