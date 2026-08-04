import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { withdrawalService } from '@/services/withdrawal.service';
import { WithdrawRequest } from '@/models';

export const requestWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { amount, paymentMethod, upiId, bankDetails } = req.body;

  const withdrawal = await withdrawalService.createWithdrawalRequest(userId, {
    amount,
    paymentMethod,
    upiId,
    bankDetails,
  });

  res
    .status(STATUS_CODES.CREATED)
    .json(new ApiResponse(withdrawal, 'Withdrawal request submitted successfully'));
});

export const cancelWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const requestId = req.params.id;

  const cancelled = await withdrawalService.cancelWithdrawalRequest(userId, requestId);
  res
    .status(STATUS_CODES.OK)
    .json(new ApiResponse(cancelled, 'Withdrawal request cancelled successfully'));
});

export const getMyWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const status = req.query.status as string;

  const query: any = { userId };
  if (status) query.status = status;

  const withdrawals = await WithdrawRequest.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await WithdrawRequest.countDocuments(query);
  const summary = await withdrawalService.getUserWithdrawalSummary(userId);

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: withdrawals,
    meta: { total, page, limit, summary },
  });
});

export const getWithdrawalSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const summary = await withdrawalService.getUserWithdrawalSummary(userId);
  res.status(STATUS_CODES.OK).json(new ApiResponse(summary, 'Wallet withdrawal summary retrieved'));
});

export const getWithdrawalDetails = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const withdrawal = await WithdrawRequest.findOne({ _id: req.params.id, userId });

  if (!withdrawal) {
    res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Withdrawal not found' });
    return;
  }

  res.status(STATUS_CODES.OK).json(new ApiResponse(withdrawal, 'Withdrawal details retrieved'));
});
