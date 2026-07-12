import { Request, Response } from 'express';
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
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, `Report status updated to ${status}`));
});
