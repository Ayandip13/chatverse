import { User, Chat, WalletTransaction, WithdrawRequest } from '@/models';
import { Role, GirlStatus, ChatStatus, TransactionType, WithdrawStatus, BoyStatus } from '@/constants/enums.constant';

class AdminDashboardRepository {
  async getMetrics() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalBoys,
      totalGirls,
      pendingGirls,
      activeChats,
      pendingWithdrawals,
      revenueData,
      todayRevenueData,
      totalRecharges,
      onlineBoys,
      onlineGirls
    ] = await Promise.all([
      User.countDocuments({ role: Role.BOY, deletedAt: null }),
      User.countDocuments({ role: Role.GIRL, deletedAt: null }),
      User.countDocuments({ role: Role.GIRL, status: GirlStatus.PENDING, deletedAt: null }),
      Chat.countDocuments({ status: ChatStatus.ACTIVE }),
      WithdrawRequest.countDocuments({ status: WithdrawStatus.PENDING }),
      WalletTransaction.aggregate([
        { $match: { type: TransactionType.RECHARGE } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      WalletTransaction.aggregate([
        { $match: { type: TransactionType.RECHARGE, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      WalletTransaction.countDocuments({ type: TransactionType.RECHARGE }),
      User.countDocuments({ role: Role.BOY, status: BoyStatus.ACTIVE, deletedAt: null }),
      User.countDocuments({ role: Role.GIRL, status: GirlStatus.APPROVED, deletedAt: null })
    ]);

    return {
      totalBoys,
      totalGirls,
      pendingGirls,
      activeChats,
      pendingWithdrawals,
      totalRevenue: revenueData[0]?.total || 0,
      todayRevenue: todayRevenueData[0]?.total || 0,
      totalRecharges,
      onlineBoys,
      onlineGirls,
    };
  }
}

export const adminDashboardRepository = new AdminDashboardRepository();
