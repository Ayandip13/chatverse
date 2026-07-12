import { Router } from 'express';
import healthRoutes from '@/api/health/health.route';
import authRoutes from '@/api/auth/auth.route';
import settingsRoutes from '@/api/settings/settings.route';
import walletRoutes from '@/api/wallet/wallet.route';
import adminRoutes from '@/api/admin/admin.route';
import chatRequestRoutes from '@/api/chat-requests/chatRequest.route';
import notificationRoutes from '@/api/notifications/notification.route';
import reportRoutes from '@/api/reports/report.route';

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

export default router;