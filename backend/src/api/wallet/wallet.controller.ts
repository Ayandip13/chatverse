import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { walletService } from '@/services/wallet.service';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.getWalletSummary(req.user!.userId);
  res.status(STATUS_CODES.OK).json(new ApiResponse(wallet, 'Wallet summary retrieved'));
});

export const getCoinBalance = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.getWalletSummary(req.user!.userId);
  res
    .status(STATUS_CODES.OK)
    .json(new ApiResponse({ currentBalance: wallet.currentBalance }, 'Coin balance retrieved'));
});

export const recharge = asyncHandler(async (req: Request, res: Response) => {
  const { amountInr } = req.body;
  const order = await walletService.createRechargeOrder(req.user!.userId, amountInr);
  res.status(STATUS_CODES.OK).json(new ApiResponse(order, 'Recharge order created'));
});

export const verifyRecharge = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amountInr } = req.body;
  const transaction = await walletService.verifyRecharge(
    req.user!.userId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    amountInr,
  );
  res.status(STATUS_CODES.OK).json(new ApiResponse(transaction, 'Recharge verified successfully'));
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, type, startDate, endDate } = req.query as any;

  const result = await walletService.getTransactionHistory(
    req.user!.userId,
    { type, startDate, endDate },
    parseInt(page, 10),
    parseInt(limit, 10),
  );

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: result.transactions,
    message: 'Transactions retrieved',
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    },
  });
});
