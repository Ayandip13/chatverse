import { Router } from 'express';
import * as chatController from './chat.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth } from '@/middlewares/auth.middleware';
import { getChatsQuerySchema, getMessagesQuerySchema } from '@/validators/chat.validator';

const router = Router();

router.use(requireAuth);

router.get('/', validate(getChatsQuerySchema), chatController.getChats);
router.get('/:id', chatController.getChatDetails);
router.get('/:id/messages', validate(getMessagesQuerySchema), chatController.getChatMessages);
router.post('/:id/end', chatController.endChat);

export default router;
