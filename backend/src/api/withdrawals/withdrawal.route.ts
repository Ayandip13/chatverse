import { Router } from 'express';
import * as withdrawalController from './withdrawal.controller';
import { requireAuth } from '@/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', withdrawalController.requestWithdrawal);
router.get('/', withdrawalController.getMyWithdrawals);
router.get('/summary', withdrawalController.getWithdrawalSummary);
router.get('/:id', withdrawalController.getWithdrawalDetails);
router.post('/:id/cancel', withdrawalController.cancelWithdrawal);

export default router;
