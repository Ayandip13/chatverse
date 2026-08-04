const fs = require("fs");
const path = require("path");

const backendDir = path.join(__dirname, "backend");
const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

mkDir(path.join(backendDir, "src/api/wallet"));
mkDir(path.join(backendDir, "src/validators"));
mkDir(path.join(backendDir, "src/repositories"));
mkDir(path.join(backendDir, "src/services"));

const files = {
  "src/validators/wallet.validator.ts": `import { z } from 'zod';
import { TransactionType } from '@/constants/enums.constant';

export const rechargeSchema = z.object({
  body: z.object({
    amountInr: z.number().min(1, 'Amount must be at least 1 INR'),
  }),
});

export const verifyRechargeSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1, 'Order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
    razorpaySignature: z.string().min(1, 'Signature is required'),
  }),
});

export const transactionHistoryQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\\d+$/).optional().default('1'),
    limit: z.string().regex(/^\\d+$/).optional().default('20'),
    type: z.nativeEnum(TransactionType).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
`,
  "src/repositories/wallet.repository.ts": `import { Wallet } from '@/models';
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
`,
  "src/repositories/walletTransaction.repository.ts": `import { WalletTransaction } from '@/models';
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
`,
  "src/services/wallet.service.ts": `import crypto from 'crypto';
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
    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Wallet not found', 'WALLET_NOT_FOUND');
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
    const mockOrderId = \`order_\${crypto.randomBytes(6).toString('hex')}\`;
    
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
    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Wallet not found', 'WALLET_NOT_FOUND');
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
`,
  "src/api/wallet/wallet.controller.ts": `import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { walletService } from '@/services/wallet.service';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.getWalletSummary(req.user!.userId);
  res.status(STATUS_CODES.OK).json(new ApiResponse(wallet, 'Wallet summary retrieved'));
});

export const getCoinBalance = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.getWalletSummary(req.user!.userId);
  res.status(STATUS_CODES.OK).json(new ApiResponse({ currentBalance: wallet.currentBalance }, 'Coin balance retrieved'));
});

export const recharge = asyncHandler(async (req: Request, res: Response) => {
  const { amountInr } = req.body;
  const order = await walletService.createRechargeOrder(req.user!.userId, amountInr);
  res.status(STATUS_CODES.OK).json(new ApiResponse(order, 'Recharge order created'));
});

export const verifyRecharge = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const transaction = await walletService.verifyRecharge(req.user!.userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  res.status(STATUS_CODES.OK).json(new ApiResponse(transaction, 'Recharge verified successfully'));
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, type, startDate, endDate } = req.query as any;
  
  const result = await walletService.getTransactionHistory(
    req.user!.userId,
    { type, startDate, endDate },
    parseInt(page, 10),
    parseInt(limit, 10)
  );

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: result.transactions,
    message: 'Transactions retrieved',
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    },
  });
});
`,
  "src/api/wallet/wallet.route.ts": `import { Router } from 'express';
import * as walletController from './wallet.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth } from '@/middlewares/auth.middleware';
import { rechargeSchema, verifyRechargeSchema, transactionHistoryQuerySchema } from '@/validators/wallet.validator';

const router = Router();

router.use(requireAuth); // All wallet routes require authentication

router.get('/', walletController.getSummary);
router.get('/balance', walletController.getCoinBalance);
router.post('/recharge', validate(rechargeSchema), walletController.recharge);
router.post('/verify', validate(verifyRechargeSchema), walletController.verifyRecharge);
router.get('/transactions', validate(transactionHistoryQuerySchema), walletController.getTransactions);

export default router;
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, "utf8");
}
console.log("Wallet scaffolding complete.");
