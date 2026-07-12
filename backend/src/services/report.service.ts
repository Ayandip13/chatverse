import { reportRepository } from '@/repositories/report.repository';
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
