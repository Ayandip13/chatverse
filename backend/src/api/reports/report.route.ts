import { Router } from 'express';
import * as reportController from './report.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth } from '@/middlewares/auth.middleware';
import { requireAdminAuth } from '@/middlewares/adminAuth.middleware';
import { createReportSchema, getReportsQuerySchema, updateReportStatusSchema } from '@/validators/report.validator';

const router = Router();

// =======================
// User Routes (Boy/Girl)
// =======================
const userRouter = Router();
userRouter.use(requireAuth);
userRouter.post('/', validate(createReportSchema), reportController.createReport);
userRouter.get('/', validate(getReportsQuerySchema), reportController.getMyReports);
userRouter.get('/:id', reportController.getReportDetails);

// =======================
// Admin Routes
// =======================
const adminRouter = Router();
adminRouter.use(requireAdminAuth);
adminRouter.get('/', validate(getReportsQuerySchema), reportController.getAdminReports);
adminRouter.get('/:id', reportController.getReportDetails);
adminRouter.patch('/:id/status', validate(updateReportStatusSchema), reportController.updateReportStatus);

// Mount them
router.use('/', userRouter);
router.use('/admin', adminRouter); // e.g. /api/v1/reports/admin

export default router;
