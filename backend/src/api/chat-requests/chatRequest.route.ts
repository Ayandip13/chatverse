import { Router } from 'express';
import * as chatRequestController from './chatRequest.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth, requireRole } from '@/middlewares/auth.middleware';
import { sendChatRequestSchema, getRequestsQuerySchema } from '@/validators/chatRequest.validator';
import { Role } from '@/constants/enums.constant';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole([Role.BOY]),
  validate(sendChatRequestSchema),
  chatRequestController.sendRequest,
);
router.post('/:id/accept', requireRole([Role.GIRL]), chatRequestController.acceptRequest);
router.post('/:id/reject', requireRole([Role.GIRL]), chatRequestController.rejectRequest);
router.post('/:id/cancel', requireRole([Role.BOY]), chatRequestController.cancelRequest);
router.get('/', validate(getRequestsQuerySchema), chatRequestController.getRequests);

export default router;
