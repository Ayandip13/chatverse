import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { verificationService } from '@/services/verification.service';
import { adminService } from '@/services/admin.service';
import { WithdrawStatus } from '@/constants/enums.constant';
import { reportRepository } from '@/repositories/report.repository';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const metrics = await adminService.getDashboardMetrics();
  res.status(STATUS_CODES.OK).json(new ApiResponse(metrics, 'Dashboard metrics retrieved'));
});

// User & Verification Management
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', role, status, search } = req.query as any;
  const result = await verificationService.getUsers(
    { role, status, search },
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 10
  );
  res.status(STATUS_CODES.OK).json({ success: true, data: result.users, meta: { total: result.total } });
});

export const getUserDetails = asyncHandler(async (req: Request, res: Response) => {
  const user = await verificationService.getUserDetails(req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(user, 'User retrieved'));
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, reason } = req.body;
  const adminId = (req as any).admin?.adminId || 'mock_admin_id';
  const updatedUser = await verificationService.updateUserStatus(req.params.id, status, adminId, reason);
  res.status(STATUS_CODES.OK).json(new ApiResponse(updatedUser, 'User status updated'));
});

// Chat Monitoring
export const getChats = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', status } = req.query as any;
  const result = await adminService.getChats(
    { status },
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 10
  );
  res.status(STATUS_CODES.OK).json({ success: true, data: result.chats, meta: { total: result.total } });
});

export const getChatMessages = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query as any;
  const result = await adminService.getChatMessages(
    req.params.id,
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 20
  );
  res.status(STATUS_CODES.OK).json({ success: true, data: result.messages, meta: { total: result.total } });
});

// Transactions
export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', type, startDate, endDate } = req.query as any;
  const result = await adminService.getTransactions(
    { type, startDate, endDate },
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 10
  );
  res.status(STATUS_CODES.OK).json({ success: true, data: result.transactions, meta: { total: result.total } });
});

// Withdrawals
export const getWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', status } = req.query as any;
  const result = await adminService.getWithdrawals(
    { status },
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 10
  );
  res.status(STATUS_CODES.OK).json({ success: true, data: result.requests, meta: { total: result.total } });
});

export const updateWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const { status, notes, rejectionReason, transactionReason, transactionReference } = req.body;
  const adminId = (req as any).admin?.adminId || 'mock_admin_id';
  const updated = await adminService.updateWithdrawalStatus(
    req.params.id,
    status as WithdrawStatus,
    adminId,
    notes,
    rejectionReason,
    transactionReference || transactionReason
  );
  res.status(STATUS_CODES.OK).json(new ApiResponse(updated, 'Withdrawal status updated'));
});

import { settlementService } from '@/services/settlement.service';

// Reports
export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status } = req.query as any;
  const result = await reportRepository.getPaginatedReports(
    status ? { status } : {},
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 20
  );
  res.status(STATUS_CODES.OK).json({ success: true, data: result.reports, meta: { total: result.total } });
});

// Financial Settlements
export const getSettlements = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', status } = req.query as any;
  const result = await settlementService.getSettlements(
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 10,
    { status }
  );
  const summary = await settlementService.getFinancialSummary();
  res.status(STATUS_CODES.OK).json({ success: true, data: result.items, meta: { total: result.total, summary } });
});

export const getFinancialSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await settlementService.getFinancialSummary();
  res.status(STATUS_CODES.OK).json(new ApiResponse(summary, 'Financial summary retrieved'));
});
