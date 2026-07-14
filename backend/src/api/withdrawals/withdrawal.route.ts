import { Router } from 'express';
import * as withdrawalController from './withdrawal.controller';
import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { requestWithdrawalSchema, getWithdrawalsQuerySchema } from '@/validators/withdrawal.validator';

const router = Router();

router.use(requireAuth);

router.post('/', validate(requestWithdrawalSchema), withdrawalController.requestWithdrawal);
router.get('/', validate(getWithdrawalsQuerySchema), withdrawalController.getMyWithdrawals);

export default router;
