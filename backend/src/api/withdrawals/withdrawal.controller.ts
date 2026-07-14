import { Request, Response, NextFunction } from 'express';
import { WithdrawRequest, Wallet } from '@/models';
import { ApiError } from '@/utils/ApiError.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import logger from '@/config/logger.config';
import { Role } from '@/constants/enums.constant';

export const requestWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { amount, upiId } = req.body;

    if (req.user!.role !== Role.GIRL) {
      throw new ApiError(403, 'Only Girls can request withdrawals');
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.currentBalance < amount) {
      throw new ApiError(400, 'Insufficient wallet balance');
    }

    // Create request
    const withdrawal = await WithdrawRequest.create({
      userId,
      amount,
      upiId,
      status: 'PENDING'
    });

    // Deduct immediately (held in escrow essentially)
    wallet.currentBalance -= amount;
    await wallet.save();

    logger.info(`User ${userId} requested withdrawal of ${amount}`);
    res.status(201).json(new ApiResponse(withdrawal, 'Withdrawal request submitted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMyWithdrawals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const query: any = { userId };
    if (status) query.status = status;

    const withdrawals = await WithdrawRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await WithdrawRequest.countDocuments(query);

    res.status(200).json({ success: true, data: withdrawals, meta: { total, page, limit } });
  } catch (error) {
    next(error);
  }
};
