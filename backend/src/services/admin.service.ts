import { adminDashboardRepository } from '@/repositories/adminDashboard.repository';
import { withdrawRequestRepository } from '@/repositories/withdrawRequest.repository';
import { walletTransactionRepository } from '@/repositories/walletTransaction.repository';
import { walletRepository } from '@/repositories/wallet.repository';
import { Chat, Message, WalletTransaction } from '@/models';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { WithdrawStatus, TransactionType } from '@/constants/enums.constant';
import { Types } from 'mongoose';

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
      Message.find({ chatId: new Types.ObjectId(chatId) }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
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

  async updateWithdrawalStatus(withdrawalId: string, status: WithdrawStatus, adminId: string, notes?: string) {
    const withdrawal = await withdrawRequestRepository.findById(withdrawalId);
    if (!withdrawal) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Withdrawal request not found', 'NOT_FOUND');
    }

    if (withdrawal.status !== WithdrawStatus.PENDING && withdrawal.status !== WithdrawStatus.PROCESSING) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, `Withdrawal already ${withdrawal.status}`, 'INVALID_TRANSITION');
    }

    const updateData: any = { status, notes };
    if (adminId && Types.ObjectId.isValid(adminId) && /^[0-9a-fA-F]{24}$/.test(adminId)) {
      updateData.processedById = new Types.ObjectId(adminId);
    }
    const updated = await withdrawRequestRepository.update(withdrawalId, updateData);

    if (status === WithdrawStatus.REJECTED) {
      // Refund the girl's wallet if rejected
      const wallet = await walletRepository.findByUserId(withdrawal.userId.toString());
      if (wallet) {
        await walletRepository.incrementBalance(withdrawal.userId.toString(), withdrawal.amount, 'lifetimeEarnings');
        await walletTransactionRepository.create({
          walletId: wallet.id,
          userId: withdrawal.userId,
          type: TransactionType.REFUND,
          amount: withdrawal.amount,
          description: `Refund for rejected withdrawal: ${notes || 'N/A'}`,
          referenceId: withdrawal._id,
        });
      }
    }

    return updated;
  }
}

export const adminService = new AdminService();
