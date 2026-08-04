import { Settlement, Wallet, WalletTransaction } from '@/models';
import { TransactionType } from '@/constants/enums.constant';
import { Types } from 'mongoose';
import logger from '@/config/logger.config';

export class SettlementService {
  /**
   * Process a single completed minute settlement for a chat session.
   * Uses atomic findOneAndUpdate with condition { currentBalance: { $gte: 10 } }
   * to guarantee wallet balance never drops below zero.
   */
  public async processMessageSettlement(
    chatId: string,
    boyId: string,
    girlId: string
  ): Promise<{ success: boolean; boyBalance?: number; girlBalance?: number; error?: string }> {
    const coinsToDeduct = 1;
    const girlEarnings = 1;

    // 1. Atomic deduction from Boy's wallet (must have >= coinsToDeduct)
    const boyWallet = await Wallet.findOneAndUpdate(
      { userId: new Types.ObjectId(boyId), currentBalance: { $gte: coinsToDeduct } },
      { 
        $inc: { currentBalance: -coinsToDeduct, lifetimeSpent: coinsToDeduct } 
      },
      { new: true }
    );

    if (!boyWallet) {
      logger.warn(`Insufficient balance for Boy ${boyId} in Chat ${chatId}`);
      return { success: false, error: 'INSUFFICIENT_FUNDS' };
    }

    // 2. Credit Girl's wallet
    const girlWallet = await Wallet.findOneAndUpdate(
      { userId: new Types.ObjectId(girlId) },
      { 
        $inc: { currentBalance: girlEarnings, lifetimeEarnings: girlEarnings } 
      },
      { upsert: true, new: true }
    );

    // 3 & 4. Create immutable Wallet Transactions and update Settlement Ledger.
    // These writes are independent of each other, so run them in parallel.
    await Promise.all([
      WalletTransaction.create({
        walletId: boyWallet._id,
        userId: new Types.ObjectId(boyId),
        type: TransactionType.CHAT_DEBIT,
        amount: coinsToDeduct,
        description: `Message billing for Chat ${chatId}`,
        referenceId: new Types.ObjectId(chatId),
      }),
      WalletTransaction.create({
        walletId: girlWallet._id,
        userId: new Types.ObjectId(girlId),
        type: TransactionType.GIRL_EARNING,
        amount: girlEarnings,
        description: `Message earnings for Chat ${chatId}`,
        referenceId: new Types.ObjectId(chatId),
      }),
      Settlement.findOneAndUpdate(
        { chatId: new Types.ObjectId(chatId) },
        {
          $set: {
            boyId: new Types.ObjectId(boyId),
            girlId: new Types.ObjectId(girlId),
            status: 'COMPLETED',
            settledAt: new Date(),
          },
          $inc: {
            completedMessages: 1,
            grossCoins: coinsToDeduct,
            platformCommissionCoins: 0,
            girlEarningsCoins: girlEarnings,
          },
        },
        { upsert: true, new: true }
      ),
    ]);

    logger.info(`Settled message for Chat ${chatId}: Boy ${boyId} (-${coinsToDeduct}), Girl ${girlId} (+${girlEarnings})`);

    return {
      success: true,
      boyBalance: boyWallet.currentBalance,
      girlBalance: girlWallet.currentBalance,
    };
  }

  /**
   * Get financial summary metrics for Admin Panel
   */
  public async getFinancialSummary() {
    const aggregate = await Settlement.aggregate([
      {
        $group: {
          _id: null,
          totalCompletedMessages: { $sum: '$completedMessages' },
          totalGrossRevenue: { $sum: '$grossCoins' },
          totalPlatformCommission: { $sum: '$platformCommissionCoins' },
          totalCreatorPayouts: { $sum: '$girlEarningsCoins' },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = aggregate[0] || {
      totalCompletedMessages: 0,
      totalGrossRevenue: 0,
      totalPlatformCommission: 0,
      totalCreatorPayouts: 0,
      count: 0,
    };

    return stats;
  }

  /**
   * Get paginated financial settlements for Admin Panel
   */
  public async getSettlements(page = 1, limit = 10, filters: any = {}) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    const [items, total] = await Promise.all([
      Settlement.find(query)
        .sort({ settledAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('boyId', 'name email avatar')
        .populate('girlId', 'name email avatar')
        .exec(),
      Settlement.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const settlementService = new SettlementService();
