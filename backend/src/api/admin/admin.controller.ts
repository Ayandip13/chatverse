import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { verificationService } from '@/services/verification.service';
import { adminService } from '@/services/admin.service';
import { WithdrawStatus } from '@/constants/enums.constant';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const metrics = await adminService.getDashboardMetrics();
  res.status(STATUS_CODES.OK).json(new ApiResponse(metrics, 'Dashboard metrics retrieved'));
});

// User & Verification Management
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, role, status, search } = req.query as any;
  const result = await verificationService.getUsers({ role, status, search }, parseInt(page, 10), parseInt(limit, 10));
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
  const { page, limit, status } = req.query as any;
  const result = await adminService.getChats({ status }, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.chats, meta: { total: result.total } });
});

export const getChatMessages = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const result = await adminService.getChatMessages(req.params.id, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.messages, meta: { total: result.total } });
});

// Transactions
export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, type, startDate, endDate } = req.query as any;
  const result = await adminService.getTransactions({ type, startDate, endDate }, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.transactions, meta: { total: result.total } });
});

// Withdrawals
export const getWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as any;
  const result = await adminService.getWithdrawals({ status }, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.requests, meta: { total: result.total } });
});

export const updateWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const adminId = (req as any).admin?.adminId || 'mock_admin_id';
  const updated = await adminService.updateWithdrawalStatus(req.params.id, status as WithdrawStatus, adminId, notes);
  res.status(STATUS_CODES.OK).json(new ApiResponse(updated, 'Withdrawal status updated'));
});
