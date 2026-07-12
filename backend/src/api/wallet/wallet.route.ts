import { Router } from 'express';
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
