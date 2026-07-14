import { Router } from 'express';
import * as userController from './user.controller';
import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { updateProfileSchema } from '@/validators/user.validator';
import { uploadAvatar } from '@/services/upload.service';

const router = Router();

router.use(requireAuth);

router.get('/me', userController.getMyProfile);
router.patch('/me', validate(updateProfileSchema), userController.updateMyProfile);
router.post('/avatar', uploadAvatar.single('avatar'), userController.uploadMyAvatar);
router.delete('/avatar', userController.deleteMyAvatar);
router.delete('/me', userController.deleteMyAccount);

// Public route for finding a user by ID
router.get('/:id/public', userController.getPublicProfile);

export default router;
