const fs = require("fs");
const path = require("path");

const backendDir = path.join(__dirname, "backend");

const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

mkDir(path.join(backendDir, "src/api/settings"));
mkDir(path.join(backendDir, "src/validators"));
mkDir(path.join(backendDir, "src/repositories"));
mkDir(path.join(backendDir, "src/services"));
mkDir(path.join(backendDir, "src/middlewares"));

const files = {
  "src/validators/settings.validator.ts": `import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    commissionPercentage: z.number().min(0).max(100).optional(),
    coinConversionRate: z.number().min(0.01).optional(),
    coinsPerMinute: z.number().min(1).optional(),
    minimumWithdrawalAmount: z.number().min(1).optional(),
    maximumRechargeAmount: z.number().min(1).optional(),
    isMaintenanceMode: z.boolean().optional(),
    isRegistrationEnabled: z.boolean().optional(),
    isGirlRegistrationEnabled: z.boolean().optional(),
    isBoyRegistrationEnabled: z.boolean().optional(),
    isGoogleLoginEnabled: z.boolean().optional(),
    isRazorpayEnabled: z.boolean().optional(),
  }),
});
`,
  "src/repositories/settings.repository.ts": `import { PlatformSetting } from '@/models';
import { IPlatformSetting } from '@/types/models.type';

class SettingsRepository {
  async getSettings(): Promise<IPlatformSetting> {
    let settings = await PlatformSetting.findOne().exec();
    if (!settings) {
      settings = await PlatformSetting.create({});
    }
    return settings;
  }

  async updateSettings(updateData: Partial<IPlatformSetting>): Promise<IPlatformSetting> {
    let settings = await PlatformSetting.findOne().exec();
    if (!settings) {
      settings = await PlatformSetting.create(updateData);
    } else {
      settings = await PlatformSetting.findOneAndUpdate({}, updateData, { new: true }).exec();
    }
    return settings as IPlatformSetting;
  }
}

export const settingsRepository = new SettingsRepository();
`,
  "src/services/settings.service.ts": `import { settingsRepository } from '@/repositories/settings.repository';
import { IPlatformSetting } from '@/types/models.type';

class SettingsService {
  async getSettings(): Promise<IPlatformSetting> {
    // Caching Strategy: Settings can be fetched frequently by the frontend on startup.
    // In the future, this can be cached in Redis with a 5-minute TTL or invalidated upon update.
    return await settingsRepository.getSettings();
  }

  async updateSettings(updateData: Partial<IPlatformSetting>): Promise<IPlatformSetting> {
    const updatedSettings = await settingsRepository.updateSettings(updateData);
    // Caching Strategy: Invalidate the Redis cache for settings here in the future.
    return updatedSettings;
  }
}

export const settingsService = new SettingsService();
`,
  "src/api/settings/settings.controller.ts": `import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { settingsService } from '@/services/settings.service';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  res.status(STATUS_CODES.OK).json(new ApiResponse(settings, 'Settings retrieved successfully'));
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const updatedSettings = await settingsService.updateSettings(req.body);
  res.status(STATUS_CODES.OK).json(new ApiResponse(updatedSettings, 'Settings updated successfully'));
});
`,
  "src/api/settings/settings.route.ts": `import { Router } from 'express';
import * as settingsController from './settings.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAdminAuth } from '@/middlewares/adminAuth.middleware';
import { updateSettingsSchema } from '@/validators/settings.validator';

const router = Router();

// Public route to fetch platform configuration on app launch
router.get('/', settingsController.getSettings);

// Admin-only route to update dynamic configuration
router.patch('/', requireAdminAuth, validate(updateSettingsSchema), settingsController.updateSettings);

export default router;
`,
  "src/middlewares/adminAuth.middleware.ts": `import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt.util';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { Admin } from '@/models';

export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Admin authentication required', 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token) as any;

    if (decoded.role !== 'ADMIN' && !decoded.adminId) {
       throw new ApiError(STATUS_CODES.FORBIDDEN, 'Admin privileges required', 'FORBIDDEN');
    }

    const admin = await Admin.findById(decoded.adminId || decoded.userId);
    if (!admin || admin.tokenVersion !== decoded.tokenVersion) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid or expired admin token', 'TOKEN_EXPIRED');
    }

    (req as any).admin = decoded;
    next();
  } catch (error) {
    next(new ApiError(STATUS_CODES.UNAUTHORIZED, 'Admin authentication failed', 'UNAUTHORIZED'));
  }
};
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, "utf8");
}
console.log("Settings scaffolding complete.");
