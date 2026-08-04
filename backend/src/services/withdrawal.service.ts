import {
  WithdrawRequest,
  Wallet,
  WalletTransaction,
  PlatformSetting,
  User,
  Notification,
} from '@/models';
import {
  WithdrawStatus,
  TransactionType,
  Role,
  GirlStatus,
  NotificationStatus,
} from '@/constants/enums.constant';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { Types } from 'mongoose';
import logger from '@/config/logger.config';

export class WithdrawalService {
  /**
   * Submit a new withdrawal request for a verified Girl creator
   */
  public async createWithdrawalRequest(
    userId: string,
    data: {
      amount: number;
      paymentMethod?: 'UPI' | 'BANK_TRANSFER';
      upiId?: string;
      bankDetails?: {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        bankName?: string;
      };
    },
  ) {
    const user = await User.findById(userId);
    if (!user || user.role !== Role.GIRL || user.status !== GirlStatus.APPROVED) {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        'Only approved female creators can request withdrawals.',
        'CREATOR_NOT_APPROVED',
      );
    }

    const settings = (await PlatformSetting.findOne()) || { minimumWithdrawalAmount: 500 };
    const minAmount = settings.minimumWithdrawalAmount || 500;

    if (data.amount < minAmount) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Minimum withdrawal amount is ₹${minAmount} (${minAmount} coins).`,
        'BELOW_MINIMUM_WITHDRAWAL',
      );
    }

    // Check for duplicate pending or approved withdrawal request
    const existingPending = await WithdrawRequest.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: [WithdrawStatus.PENDING, WithdrawStatus.APPROVED, WithdrawStatus.PROCESSING] },
    });

    if (existingPending) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        'You already have an active pending or approved withdrawal request in queue.',
        'DUPLICATE_PENDING_REQUEST',
      );
    }

    // Atomic wallet balance check & lock (deduction)
    const wallet = await Wallet.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), currentBalance: { $gte: data.amount } },
      { $inc: { currentBalance: -data.amount } },
      { new: true },
    );

    if (!wallet) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        'Insufficient available wallet balance for this withdrawal amount.',
        'INSUFFICIENT_FUNDS',
      );
    }

    const platformFee = 0;
    const netAmount = data.amount - platformFee;
    const paymentMethod = data.paymentMethod || (data.upiId ? 'UPI' : 'BANK_TRANSFER');

    // Create immutable WithdrawRequest document
    const withdrawal = await WithdrawRequest.create({
      userId: new Types.ObjectId(userId),
      amount: data.amount,
      platformFee,
      netAmount,
      paymentMethod,
      upiId: data.upiId,
      bankDetails: data.bankDetails,
      status: WithdrawStatus.PENDING,
      requestedAt: new Date(),
    });

    // Create WalletTransaction log
    await WalletTransaction.create({
      walletId: wallet._id,
      userId: new Types.ObjectId(userId),
      type: TransactionType.WITHDRAWAL,
      amount: data.amount,
      description: `Withdrawal request #${withdrawal._id} submitted`,
      referenceId: withdrawal._id,
    });

    // Create Notification
    await Notification.create({
      userId: new Types.ObjectId(userId),
      title: 'Withdrawal Requested',
      body: `Your request for ₹${data.amount} has been submitted for admin review.`,
      type: 'WITHDRAWAL_REQUESTED',
      status: NotificationStatus.UNREAD,
    });

    logger.info(`User ${userId} created withdrawal request ${withdrawal._id} for ₹${data.amount}`);
    return withdrawal;
  }

  /**
   * Cancel a pending withdrawal request
   */
  public async cancelWithdrawalRequest(userId: string, requestId: string) {
    const withdrawal = await WithdrawRequest.findOne({
      _id: new Types.ObjectId(requestId),
      userId: new Types.ObjectId(userId),
    });

    if (!withdrawal) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Withdrawal request not found.', 'NOT_FOUND');
    }

    if (withdrawal.status !== WithdrawStatus.PENDING) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Cannot cancel a withdrawal that is already ${withdrawal.status}.`,
        'INVALID_TRANSITION',
      );
    }

    withdrawal.status = WithdrawStatus.CANCELLED;
    await withdrawal.save();

    // Refund locked balance back to creator wallet
    const wallet = await Wallet.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { currentBalance: withdrawal.amount } },
      { new: true },
    );

    if (wallet) {
      await WalletTransaction.create({
        walletId: wallet._id,
        userId: new Types.ObjectId(userId),
        type: TransactionType.REFUND,
        amount: withdrawal.amount,
        description: `Refund for cancelled withdrawal #${withdrawal._id}`,
        referenceId: withdrawal._id,
      });
    }

    logger.info(`User ${userId} cancelled withdrawal request ${requestId}`);
    return withdrawal;
  }

  /**
   * Get wallet summary for creator (Current Balance, Locked Balance, Lifetime Earnings, Lifetime Withdrawn)
   */
  public async getUserWithdrawalSummary(userId: string) {
    const wallet = (await Wallet.findOne({ userId: new Types.ObjectId(userId) })) || {
      currentBalance: 0,
      lifetimeEarnings: 0,
      lifetimeSpent: 0,
      lifetimeWithdraw: 0,
    };

    const pendingAggregate = await WithdrawRequest.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          status: {
            $in: [WithdrawStatus.PENDING, WithdrawStatus.APPROVED, WithdrawStatus.PROCESSING],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalLocked: { $sum: '$amount' },
        },
      },
    ]);

    const lockedBalance = pendingAggregate[0]?.totalLocked || 0;

    return {
      currentBalance: wallet.currentBalance,
      lockedBalance,
      availableBalance: wallet.currentBalance,
      lifetimeEarnings: wallet.lifetimeEarnings,
      lifetimeWithdraw: wallet.lifetimeWithdraw,
    };
  }

  /**
   * Admin Approve Withdrawal Request
   */
  public async adminApprove(requestId: string, adminId: string, notes?: string) {
    const withdrawal = await WithdrawRequest.findById(requestId);
    if (!withdrawal) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Withdrawal request not found.', 'NOT_FOUND');
    }

    if (withdrawal.status !== WithdrawStatus.PENDING) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Withdrawal request is already ${withdrawal.status}.`,
        'INVALID_TRANSITION',
      );
    }

    withdrawal.status = WithdrawStatus.APPROVED;
    withdrawal.reviewedById = new Types.ObjectId(adminId);
    withdrawal.reviewedAt = new Date();
    if (notes) withdrawal.notes = notes;
    await withdrawal.save();

    await Notification.create({
      userId: withdrawal.userId,
      title: 'Withdrawal Approved',
      body: `Your request for ₹${withdrawal.amount} has been approved and is queued for payout transfer.`,
      type: 'WITHDRAWAL_APPROVED',
      status: NotificationStatus.UNREAD,
    });

    logger.info(`Admin ${adminId} approved withdrawal ${requestId}`);
    return withdrawal;
  }

  /**
   * Admin Reject Withdrawal Request (Unlocks and refunds balance)
   */
  public async adminReject(requestId: string, adminId: string, reason: string, notes?: string) {
    const withdrawal = await WithdrawRequest.findById(requestId);
    if (!withdrawal) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Withdrawal request not found.', 'NOT_FOUND');
    }

    if (
      withdrawal.status !== WithdrawStatus.PENDING &&
      withdrawal.status !== WithdrawStatus.APPROVED &&
      withdrawal.status !== WithdrawStatus.PROCESSING
    ) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Cannot reject a withdrawal that is already ${withdrawal.status}.`,
        'INVALID_TRANSITION',
      );
    }

    withdrawal.status = WithdrawStatus.REJECTED;
    withdrawal.reviewedById = new Types.ObjectId(adminId);
    withdrawal.reviewedAt = new Date();
    withdrawal.rejectionReason = reason || 'Request rejected by administrator';
    if (notes) withdrawal.notes = notes;
    await withdrawal.save();

    // Refund locked balance back to creator's wallet
    const wallet = await Wallet.findOneAndUpdate(
      { userId: withdrawal.userId },
      { $inc: { currentBalance: withdrawal.amount } },
      { new: true },
    );

    if (wallet) {
      await WalletTransaction.create({
        walletId: wallet._id,
        userId: withdrawal.userId,
        type: TransactionType.REFUND,
        amount: withdrawal.amount,
        description: `Refund for rejected withdrawal: ${reason}`,
        referenceId: withdrawal._id,
      });
    }

    await Notification.create({
      userId: withdrawal.userId,
      title: 'Withdrawal Rejected',
      body: `Your request for ₹${withdrawal.amount} was rejected: ${reason}`,
      type: 'WITHDRAWAL_REJECTED',
      status: NotificationStatus.UNREAD,
    });

    logger.info(`Admin ${adminId} rejected withdrawal ${requestId} for reason: ${reason}`);
    return withdrawal;
  }

  /**
   * Admin Mark Payout Completed (Paid)
   */
  public async adminMarkPaid(
    requestId: string,
    adminId: string,
    transactionReference: string,
    notes?: string,
  ) {
    const withdrawal = await WithdrawRequest.findById(requestId);
    if (!withdrawal) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Withdrawal request not found.', 'NOT_FOUND');
    }

    if (
      withdrawal.status !== WithdrawStatus.APPROVED &&
      withdrawal.status !== WithdrawStatus.PENDING &&
      withdrawal.status !== WithdrawStatus.PROCESSING
    ) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Cannot mark paid for a withdrawal that is ${withdrawal.status}.`,
        'INVALID_TRANSITION',
      );
    }

    withdrawal.status = WithdrawStatus.COMPLETED; // Paid
    withdrawal.reviewedById = new Types.ObjectId(adminId);
    withdrawal.paidAt = new Date();
    withdrawal.transactionReference = transactionReference || `TXN_${Date.now()}`;
    if (notes) withdrawal.notes = notes;
    await withdrawal.save();

    // Increment lifetimeWithdraw on wallet
    await Wallet.findOneAndUpdate(
      { userId: withdrawal.userId },
      { $inc: { lifetimeWithdraw: withdrawal.amount } },
    );

    await Notification.create({
      userId: withdrawal.userId,
      title: 'Payout Completed',
      body: `₹${withdrawal.amount} has been successfully transferred to your account. Ref: ${withdrawal.transactionReference}`,
      type: 'WITHDRAWAL_COMPLETED',
      status: NotificationStatus.UNREAD,
    });

    logger.info(
      `Admin ${adminId} marked withdrawal ${requestId} paid with ref ${withdrawal.transactionReference}`,
    );
    return withdrawal;
  }
}

export const withdrawalService = new WithdrawalService();
