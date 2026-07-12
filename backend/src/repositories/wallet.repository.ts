import { Wallet } from '@/models';
import { IWallet } from '@/types/models.type';

class WalletRepository {
  async create(userId: string): Promise<IWallet> {
    return Wallet.create({ userId });
  }

  async findByUserId(userId: string): Promise<IWallet | null> {
    return Wallet.findOne({ userId }).exec();
  }

  // Atomic update logic using Mongoose $inc
  async incrementBalance(userId: string, amount: number, fieldName: 'lifetimeRecharge' | 'lifetimeEarnings' | 'lifetimeSpent' | 'lifetimeWithdraw'): Promise<IWallet | null> {
    const updateQuery: any = { $inc: { currentBalance: amount } };
    if (amount > 0) {
      updateQuery.$inc[fieldName] = amount;
    } else {
      updateQuery.$inc[fieldName] = Math.abs(amount);
    }
    
    return Wallet.findOneAndUpdate({ userId }, updateQuery, { new: true }).exec();
  }
}

export const walletRepository = new WalletRepository();
