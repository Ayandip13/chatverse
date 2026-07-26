import { Router } from 'express';
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
router.post('/withdrawals/:id/process', validate(updateWithdrawalSchema), adminController.updateWithdrawal); // Alias to match contract

// Reports
router.get('/reports', adminController.getReports);

// Financial Settlements
router.get('/settlements', adminController.getSettlements);
router.get('/settlements/summary', adminController.getFinancialSummary);

export default router;
