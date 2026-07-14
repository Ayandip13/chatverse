import { Router } from 'express';
import * as userController from './user.controller';
import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { updateProfileSchema } from '@/validators/user.validator';

const router = Router();

router.use(requireAuth);

router.get('/me', userController.getMyProfile);
router.patch('/me', validate(updateProfileSchema), userController.updateMyProfile);
router.delete('/me', userController.deleteMyAccount);

export default router;
