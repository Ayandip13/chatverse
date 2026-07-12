import { WalletTransaction } from '@/models';
import { IWalletTransaction } from '@/types/models.type';
import { Types, FilterQuery } from 'mongoose';

class WalletTransactionRepository {
  async create(data: Partial<IWalletTransaction>): Promise<IWalletTransaction> {
    return WalletTransaction.create(data);
  }

  async findByReferenceId(referenceId: string, type: string): Promise<IWalletTransaction | null> {
    return WalletTransaction.findOne({ referenceId, type }).exec();
  }

  async getPaginatedHistory(
    userId: string,
    filters: { type?: string; startDate?: string; endDate?: string },
    page: number,
    limit: number
  ) {
    const query: FilterQuery<IWalletTransaction> = { userId: new Types.ObjectId(userId) };

    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      WalletTransaction.countDocuments(query).exec(),
    ]);

    return { transactions, total };
  }
}

export const walletTransactionRepository = new WalletTransactionRepository();
