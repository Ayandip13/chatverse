const fs = require("fs");
const path = require("path");

const backendDir = path.join(__dirname, "backend");

const files = {
  "src/validators/adminExtended.validator.ts": `import { z } from 'zod';
import { WithdrawStatus } from '@/constants/enums.constant';

export const getChatsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\\d+$/).optional().default('1'),
    limit: z.string().regex(/^\\d+$/).optional().default('20'),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const getTransactionsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\\d+$/).optional().default('1'),
    limit: z.string().regex(/^\\d+$/).optional().default('20'),
    type: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const getWithdrawalsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\\d+$/).optional().default('1'),
    limit: z.string().regex(/^\\d+$/).optional().default('20'),
    status: z.nativeEnum(WithdrawStatus).optional(),
  }),
});

export const updateWithdrawalSchema = z.object({
  body: z.object({
    status: z.nativeEnum(WithdrawStatus),
    notes: z.string().optional(),
  }),
});
`,
  "src/repositories/withdrawRequest.repository.ts": `import { WithdrawRequest } from '@/models';
import { IWithdrawRequest } from '@/types/models.type';
import { FilterQuery, Types } from 'mongoose';

class WithdrawRequestRepository {
  async getPaginatedRequests(filters: { status?: string }, page: number, limit: number) {
    const query: FilterQuery<IWithdrawRequest> = {};
    if (filters.status) {
      query.status = filters.status;
    }
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      WithdrawRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email phone avatar').exec(),
      WithdrawRequest.countDocuments(query).exec(),
    ]);

    return { requests, total };
  }

  async findById(id: string): Promise<IWithdrawRequest | null> {
    return WithdrawRequest.findById(id).exec();
  }

  async update(id: string, updateData: Partial<IWithdrawRequest>): Promise<IWithdrawRequest | null> {
    return WithdrawRequest.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
}

export const withdrawRequestRepository = new WithdrawRequestRepository();
`,
  "src/repositories/adminDashboard.repository.ts": `import { User, Chat, WalletTransaction, WithdrawRequest } from '@/models';
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
`,
  "src/services/admin.service.ts": `import { adminDashboardRepository } from '@/repositories/adminDashboard.repository';
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
      throw new ApiError(STATUS_CODES.BAD_REQUEST, \`Withdrawal already \${withdrawal.status}\`, 'INVALID_TRANSITION');
    }

    const updated = await withdrawRequestRepository.update(withdrawalId, { 
      status, 
      notes, 
      processedById: new Types.ObjectId(adminId) 
    });

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
          description: \`Refund for rejected withdrawal: \${notes || 'N/A'}\`,
          referenceId: withdrawal._id,
        });
      }
    }

    return updated;
  }
}

export const adminService = new AdminService();
`,
  "src/api/admin/admin.controller.ts": `import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { verificationService } from '@/services/verification.service';
import { adminService } from '@/services/admin.service';
import { WithdrawStatus } from '@/constants/enums.constant';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const metrics = await adminService.getDashboardMetrics();
  res.status(STATUS_CODES.OK).json(new ApiResponse(metrics, 'Dashboard metrics retrieved'));
});

// User & Verification Management
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, role, status, search } = req.query as any;
  const result = await verificationService.getUsers({ role, status, search }, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.users, meta: { total: result.total } });
});

export const getUserDetails = asyncHandler(async (req: Request, res: Response) => {
  const user = await verificationService.getUserDetails(req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(user, 'User retrieved'));
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, reason } = req.body;
  const adminId = (req as any).admin?.adminId || 'mock_admin_id';
  const updatedUser = await verificationService.updateUserStatus(req.params.id, status, adminId, reason);
  res.status(STATUS_CODES.OK).json(new ApiResponse(updatedUser, 'User status updated'));
});

// Chat Monitoring
export const getChats = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as any;
  const result = await adminService.getChats({ status }, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.chats, meta: { total: result.total } });
});

export const getChatMessages = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const result = await adminService.getChatMessages(req.params.id, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.messages, meta: { total: result.total } });
});

// Transactions
export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, type, startDate, endDate } = req.query as any;
  const result = await adminService.getTransactions({ type, startDate, endDate }, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.transactions, meta: { total: result.total } });
});

// Withdrawals
export const getWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as any;
  const result = await adminService.getWithdrawals({ status }, parseInt(page, 10), parseInt(limit, 10));
  res.status(STATUS_CODES.OK).json({ success: true, data: result.requests, meta: { total: result.total } });
});

export const updateWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const adminId = (req as any).admin?.adminId || 'mock_admin_id';
  const updated = await adminService.updateWithdrawalStatus(req.params.id, status as WithdrawStatus, adminId, notes);
  res.status(STATUS_CODES.OK).json(new ApiResponse(updated, 'Withdrawal status updated'));
});
`,
  "src/api/admin/admin.route.ts": `import { Router } from 'express';
import * as adminController from './admin.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAdminAuth } from '@/middlewares/adminAuth.middleware';
import { updateStatusSchema, getUsersQuerySchema } from '@/validators/admin.validator';
import { 
  getChatsQuerySchema, 
  getTransactionsQuerySchema, 
  getWithdrawalsQuerySchema, 
  updateWithdrawalSchema 
} from '@/validators/adminExtended.validator';

const router = Router();

router.use(requireAdminAuth);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User & Verification Management
router.get('/users', validate(getUsersQuerySchema), adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/status', validate(updateStatusSchema), adminController.updateUserStatus);

// Chat Monitoring
router.get('/chats', validate(getChatsQuerySchema), adminController.getChats);
router.get('/chats/:id/messages', adminController.getChatMessages);

// Transactions & Wallet Monitoring
router.get('/transactions', validate(getTransactionsQuerySchema), adminController.getTransactions);

// Withdrawal Management
router.get('/withdrawals', validate(getWithdrawalsQuerySchema), adminController.getWithdrawals);
router.patch('/withdrawals/:id/status', validate(updateWithdrawalSchema), adminController.updateWithdrawal);

export default router;
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, "utf8");
}
console.log("Admin Extended scaffolding complete.");
