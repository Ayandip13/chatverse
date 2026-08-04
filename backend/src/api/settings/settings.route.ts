import { Router } from 'express';
import * as settingsController from './settings.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAdminAuth } from '@/middlewares/adminAuth.middleware';
import { updateSettingsSchema } from '@/validators/settings.validator';

const router = Router();

// Public route to fetch platform configuration on app launch
router.get('/', settingsController.getSettings);

// Admin-only route to update dynamic configuration
router.patch(
  '/',
  requireAdminAuth,
  validate(updateSettingsSchema),
  settingsController.updateSettings,
);

export default router;
