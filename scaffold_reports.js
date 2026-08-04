const fs = require("fs");
const path = require("path");

const backendDir = path.join(__dirname, "backend");
const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

mkDir(path.join(backendDir, "src/api/reports"));
mkDir(path.join(backendDir, "src/validators"));
mkDir(path.join(backendDir, "src/services"));
mkDir(path.join(backendDir, "src/repositories"));

const files = {
  "src/validators/report.validator.ts": `import { z } from 'zod';
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
    page: z.string().regex(/^\\d+$/).optional().default('1'),
    limit: z.string().regex(/^\\d+$/).optional().default('20'),
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
`,
  "src/repositories/report.repository.ts": `import { Report } from '@/models';
import { IReport } from '@/types/models.type';
import { FilterQuery, Types } from 'mongoose';

class ReportRepository {
  async create(data: Partial<IReport>): Promise<IReport> {
    return Report.create(data);
  }

  async findDuplicate(reporterId: string, targetId: string, reason: string): Promise<IReport | null> {
    // A duplicate is considered the same reporter reporting the same target for the same reason
    // while the previous report is still PENDING or UNDER_REVIEW
    return Report.findOne({
      reporterId: new Types.ObjectId(reporterId),
      targetId: new Types.ObjectId(targetId),
      reason,
      status: { $in: ['PENDING', 'UNDER_REVIEW'] }
    }).exec();
  }

  async findById(id: string): Promise<IReport | null> {
    return Report.findById(id).populate('reporterId targetId resolvedById', 'name email role').exec();
  }

  async getPaginatedReports(filters: FilterQuery<IReport>, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reporterId targetId', 'name email role avatar')
        .exec(),
      Report.countDocuments(filters).exec(),
    ]);

    return { reports, total };
  }

  async updateStatus(id: string, updateData: Partial<IReport>): Promise<IReport | null> {
    return Report.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
}

export const reportRepository = new ReportRepository();
`,
  "src/services/report.service.ts": `import { reportRepository } from '@/repositories/report.repository';
import { userRepository } from '@/repositories/user.repository';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { ReportStatus, Role } from '@/constants/enums.constant';
import { Types, FilterQuery } from 'mongoose';
import { IReport } from '@/types/models.type';

class ReportService {
  async createReport(reporterId: string, targetId: string, reason: string, notes?: string, evidence?: string) {
    if (reporterId === targetId) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'You cannot report yourself');
    }

    const target = await userRepository.findById(targetId);
    if (!target) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Target user not found', 'USER_NOT_FOUND');
    }

    // Duplicate Prevention Strategy
    const duplicate = await reportRepository.findDuplicate(reporterId, targetId, reason);
    if (duplicate) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'You have already reported this user for this reason. It is under review.', 'DUPLICATE_REPORT');
    }

    const report = await reportRepository.create({
      reporterId: new Types.ObjectId(reporterId),
      targetId: new Types.ObjectId(targetId),
      reason,
      notes,
      evidence,
      status: ReportStatus.PENDING,
    });

    return report;
  }

  async getReports(userId: string, role: string, filters: any, page: number, limit: number) {
    const query: FilterQuery<IReport> = {};

    // If Admin, they can see all, otherwise force user to only see their own submitted reports
    // Admin integration: We rely on the controller to pass role = 'ADMIN' if requested via Admin route
    if (role !== 'ADMIN') {
      query.reporterId = new Types.ObjectId(userId);
    }

    if (filters.status) query.status = filters.status;
    if (filters.targetId) query.targetId = new Types.ObjectId(filters.targetId);

    return await reportRepository.getPaginatedReports(query, page, limit);
  }

  async getReportDetails(userId: string, role: string, reportId: string) {
    const report = await reportRepository.findById(reportId);
    if (!report) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Report not found', 'NOT_FOUND');
    }

    // Security: Only Admins or the Reporter can view details
    if (role !== 'ADMIN' && report.reporterId._id.toString() !== userId) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'Unauthorized access', 'UNAUTHORIZED');
    }

    return report;
  }

  async updateReportStatus(adminId: string, reportId: string, status: ReportStatus, notes?: string) {
    const report = await reportRepository.findById(reportId);
    if (!report) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Report not found', 'NOT_FOUND');
    }

    const updated = await reportRepository.updateStatus(reportId, {
      status,
      notes: notes || report.notes,
      resolvedById: new Types.ObjectId(adminId),
    });

    // In the future, if a user is BANNED as a result of a report, 
    // the verificationService.updateUserStatus would be called here.
    return updated;
  }
}

export const reportService = new ReportService();
`,
  "src/api/reports/report.controller.ts": `import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { reportService } from '@/services/report.service';
import { ReportStatus } from '@/constants/enums.constant';

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  const { targetId, reason, notes, evidence } = req.body;
  const result = await reportService.createReport(req.user!.userId, targetId, reason, notes, evidence);
  res.status(STATUS_CODES.CREATED).json(new ApiResponse(result, 'Report submitted successfully'));
});

export const getMyReports = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as any;
  const result = await reportService.getReports(req.user!.userId, req.user!.role, { status }, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.reports, meta: { total: result.total } });
});

export const getReportDetails = asyncHandler(async (req: Request, res: Response) => {
  // If admin, we would use the adminId. But this route is mixed for both.
  const isAdmin = (req as any).admin ? true : false;
  const userId = isAdmin ? (req as any).admin.adminId : req.user!.userId;
  const role = isAdmin ? 'ADMIN' : req.user!.role;

  const report = await reportService.getReportDetails(userId, role, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(report, 'Report retrieved'));
});

// Admin Controllers
export const getAdminReports = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, targetId } = req.query as any;
  const result = await reportService.getReports('admin', 'ADMIN', { status, targetId }, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.reports, meta: { total: result.total } });
});

export const updateReportStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const adminId = (req as any).admin?.adminId || (req as any).admin?.userId; // Handling different JWT structures
  const result = await reportService.updateReportStatus(adminId, req.params.id, status as ReportStatus, notes);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, \`Report status updated to \${status}\`));
});
`,
  "src/api/reports/report.route.ts": `import { Router } from 'express';
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
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, "utf8");
}
console.log("Report scaffolding complete.");
