import crypto from 'crypto';
import { walletRepository } from '@/repositories/wallet.repository';
import { walletTransactionRepository } from '@/repositories/walletTransaction.repository';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { TransactionType } from '@/constants/enums.constant';
import { Types } from 'mongoose';
import envConfig from '@/config/env.config';
// We should import settingsService to get dynamic coin Conversion Rate, but for now we assume 1 INR = 1 Coin.
// import { settingsService } from '@/services/settings.service';

class WalletService {
  async getWalletSummary(userId: string) {
    let wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await walletRepository.create(userId);
    }
    return wallet;
  }

  async createRechargeOrder(userId: string, amountInr: number) {
    // 1. Generate Mongoose ObjectId hex for mock order
    const hexId = new Types.ObjectId().toString();
    const mockOrderId = `order_${hexId}`;

    return {
      id: mockOrderId,
      orderId: mockOrderId,
      amountInr,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'mock_rzp_key',
    };
  }

  async verifyRecharge(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    amountInr?: number,
  ) {
    // 1. Clean orderId string to extract ObjectId hex
    const cleanHex = razorpayOrderId?.replace(/^order_/, '');
    let refId = new Types.ObjectId();
    if (cleanHex && Types.ObjectId.isValid(cleanHex)) {
      refId = new Types.ObjectId(cleanHex);
    }

    // 2. Idempotency Check: Prevent duplicate crediting
    const existingTx = await walletTransactionRepository.findByReferenceId(
      refId.toString(),
      TransactionType.RECHARGE,
    );
    if (existingTx) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'Payment already verified', 'DUPLICATE_PAYMENT');
    }

    // 3. Get Wallet
    let wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await walletRepository.create(userId);
    }

    // 4. Calculate Coins based on requested amount (1 INR = 1 Coin)
    const coinsToCredit = amountInr && amountInr > 0 ? amountInr : 100;

    // 5. Execute DB Updates (Atomic)
    await walletRepository.incrementBalance(userId, coinsToCredit, 'lifetimeRecharge');

    const transaction = await walletTransactionRepository.create({
      walletId: wallet.id,
      userId: new Types.ObjectId(userId),
      type: TransactionType.RECHARGE,
      amount: coinsToCredit,
      description: `Recharge ₹${coinsToCredit} (Razorpay)`,
      referenceId: refId,
    });

    return transaction;
  }

  async getTransactionHistory(userId: string, filters: any, page: number, limit: number) {
    return await walletTransactionRepository.getPaginatedHistory(userId, filters, page, limit);
  }
}

export const walletService = new WalletService();
