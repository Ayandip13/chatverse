import { Router } from 'express';
import * as notificationController from './notification.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth } from '@/middlewares/auth.middleware';
import { getNotificationsQuerySchema } from '@/validators/notification.validator';

const router = Router();

// Notice: In the future, if you want Admin notifications (which are tied to Admin accounts),
// you can apply requireAdminAuth. For now, this handles all standard Users (Boy/Girl).
router.use(requireAuth);

router.get('/', validate(getNotificationsQuerySchema), notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/read-all', notificationController.markAllAsRead);
router.get('/:id', notificationController.getNotificationDetails);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
