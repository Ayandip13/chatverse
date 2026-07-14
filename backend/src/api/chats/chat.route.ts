import { Router } from 'express';
import * as chatController from './chat.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth } from '@/middlewares/auth.middleware';
import { getChatsQuerySchema, getMessagesQuerySchema } from '@/validators/chat.validator';
import * as ratingController from '@/api/ratings/rating.controller';
import { createRatingSchema } from '@/validators/rating.validator';

const router = Router();

router.use(requireAuth);

router.get('/', validate(getChatsQuerySchema), chatController.getChats);
router.get('/:id', chatController.getChatDetails);
router.get('/:id/messages', validate(getMessagesQuerySchema), chatController.getChatMessages);
router.post('/:id/end', chatController.endChat);
router.post('/:id/ratings', validate(createRatingSchema), ratingController.rateUser); // Contract matching

export default router;
