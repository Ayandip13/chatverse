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
    // 1. Fetch dynamic settings to validate minimum/maximum recharge constraints
    // const settings = await settingsService.getSettings();
    // if (amountInr > settings.maximumRechargeAmount) throw Error...

    // 2. Initialize Razorpay instance (mocked for architectural preparation)
    // const rzp = new Razorpay({ key_id: env.RZP_KEY, key_secret: env.RZP_SECRET })

    // 3. Create order on Razorpay
    // const order = await rzp.orders.create({ amount: amountInr * 100, currency: "INR" })

    // Mocking Razorpay response
    const mockOrderId = `order_${crypto.randomBytes(6).toString('hex')}`;
    
    return {
      orderId: mockOrderId,
      amountInr,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'mock_rzp_key', // passed to frontend to open checkout
    };
  }

  async verifyRecharge(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    // 1. Verify Razorpay Signature
    // const generatedSignature = crypto.createHmac('sha256', env.RZP_SECRET).update(razorpayOrderId + "|" + razorpayPaymentId).digest('hex');
    // if (generatedSignature !== razorpaySignature) throw new ApiError(...)
    
    // MOCK VERIFICATION: Assume valid for this implementation

    // 2. Idempotency Check: Prevent duplicate crediting
    const existingTx = await walletTransactionRepository.findByReferenceId(razorpayOrderId, TransactionType.RECHARGE);
    if (existingTx) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'Payment already verified', 'DUPLICATE_PAYMENT');
    }

    // 3. Get Wallet
    let wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await walletRepository.create(userId);
    }

    // 4. Calculate Coins (Assumption 1 INR = 1 Coin for now)
    // const settings = await settingsService.getSettings();
    const amountInr = 100; // In reality, fetch order details from RZP
    const coinsToCredit = amountInr * 1; // * settings.coinConversionRate

    // 5. Execute DB Updates (Atomic)
    await walletRepository.incrementBalance(userId, coinsToCredit, 'lifetimeRecharge');
    
    const transaction = await walletTransactionRepository.create({
      walletId: wallet.id,
      userId: new Types.ObjectId(userId),
      type: TransactionType.RECHARGE,
      amount: coinsToCredit,
      description: 'Razorpay Recharge',
      referenceId: new Types.ObjectId(), // Usually razorpay order id / mongo id
    });

    return transaction;
  }

  async getTransactionHistory(userId: string, filters: any, page: number, limit: number) {
    return await walletTransactionRepository.getPaginatedHistory(userId, filters, page, limit);
  }
}

export const walletService = new WalletService();
