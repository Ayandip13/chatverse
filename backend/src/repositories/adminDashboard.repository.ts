import { User, Chat, WalletTransaction, WithdrawRequest } from '@/models';
import { Role, GirlStatus, ChatStatus, TransactionType, WithdrawStatus } from '@/constants/enums.constant';

class AdminDashboardRepository {
  async getMetrics() {
    const [
      totalBoys,
      totalGirls,
      pendingGirls,
      activeChats,
      pendingWithdrawals,
      revenueData
    ] = await Promise.all([
      User.countDocuments({ role: Role.BOY, deletedAt: null }),
      User.countDocuments({ role: Role.GIRL, deletedAt: null }),
      User.countDocuments({ role: Role.GIRL, status: GirlStatus.PENDING, deletedAt: null }),
      Chat.countDocuments({ status: ChatStatus.ACTIVE }),
      WithdrawRequest.countDocuments({ status: WithdrawStatus.PENDING }),
      WalletTransaction.aggregate([
        { $match: { type: TransactionType.RECHARGE } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    return {
      totalBoys,
      totalGirls,
      pendingGirls,
      activeChats,
      pendingWithdrawals,
      totalRevenue: revenueData[0]?.total || 0,
      // Online girls and other stats can be implemented by querying Redis presence map or extending User schema.
    };
  }
}

export const adminDashboardRepository = new AdminDashboardRepository();
