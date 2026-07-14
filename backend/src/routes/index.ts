import { Router } from 'express';
import healthRoutes from '@/api/health/health.route';
import authRoutes from '@/api/auth/auth.route';
import settingsRoutes from '@/api/settings/settings.route';
import walletRoutes from '@/api/wallet/wallet.route';
import adminRoutes from '@/api/admin/admin.route';
import chatRequestRoutes from '@/api/chat-requests/chatRequest.route';
import notificationRoutes from '@/api/notifications/notification.route';
import reportRoutes from '@/api/reports/report.route';
import girlsRoutes from '@/api/girls/girls.route';
import chatRoutes from '@/api/chats/chat.route';
import userRoutes from '@/api/users/user.route';
import withdrawalRoutes from '@/api/withdrawals/withdrawal.route';
import ratingRoutes from '@/api/ratings/rating.route';

const router = Router();

// API Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/wallet', walletRoutes);
router.use('/admin', adminRoutes);
router.use('/chat-requests', chatRequestRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/girls', girlsRoutes);
router.use('/chats', chatRoutes);
router.use('/users', userRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/ratings', ratingRoutes);

export default router;