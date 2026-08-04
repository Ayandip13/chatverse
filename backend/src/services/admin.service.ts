import { adminDashboardRepository } from '@/repositories/adminDashboard.repository';
import { withdrawRequestRepository } from '@/repositories/withdrawRequest.repository';
import { walletTransactionRepository } from '@/repositories/walletTransaction.repository';
import { walletRepository } from '@/repositories/wallet.repository';
import { Chat, Message, WalletTransaction } from '@/models';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { WithdrawStatus, TransactionType } from '@/constants/enums.constant';
import { Types } from 'mongoose';
import { withdrawalService } from './withdrawal.service';

class AdminService {
  async getDashboardMetrics() {
    return await adminDashboardRepository.getMetrics();
  }

  async getChats(filters: any, page: number, limit: number) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      Chat.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('boyId girlId', 'name email role')
        .exec(),
      Chat.countDocuments(query).exec(),
    ]);

    return { chats, total };
  }

  async getChatMessages(chatId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      Message.find({ chatId: new Types.ObjectId(chatId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Message.countDocuments({ chatId: new Types.ObjectId(chatId) }).exec(),
    ]);
    return { messages, total };
  }

  async getTransactions(filters: any, page: number, limit: number) {
    const query: any = {};
    if (filters.type) query.type = filters.type;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .exec(),
      WalletTransaction.countDocuments(query).exec(),
    ]);

    return { transactions, total };
  }

  async getWithdrawals(filters: any, page: number, limit: number) {
    return await withdrawRequestRepository.getPaginatedRequests(filters, page, limit);
  }

  async updateWithdrawalStatus(
    withdrawalId: string,
    status: WithdrawStatus,
    adminId: string,
    notes?: string,
    rejectionReason?: string,
    transactionReference?: string,
  ) {
    if (status === WithdrawStatus.APPROVED) {
      return await withdrawalService.adminApprove(withdrawalId, adminId, notes);
    } else if (status === WithdrawStatus.REJECTED) {
      return await withdrawalService.adminReject(
        withdrawalId,
        adminId,
        rejectionReason || notes || 'Rejected by administrator',
        notes,
      );
    } else if (status === WithdrawStatus.COMPLETED || (status as any) === 'PAID') {
      return await withdrawalService.adminMarkPaid(
        withdrawalId,
        adminId,
        transactionReference || notes || `TXN_${Date.now()}`,
        notes,
      );
    } else {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Unsupported withdrawal status '${status}'`,
        'INVALID_STATUS',
      );
    }
  }
}

export const adminService = new AdminService();
