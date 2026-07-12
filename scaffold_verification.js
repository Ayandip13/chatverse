const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

mkDir(path.join(backendDir, 'src/api/admin'));
mkDir(path.join(backendDir, 'src/validators'));
mkDir(path.join(backendDir, 'src/services'));
mkDir(path.join(backendDir, 'src/repositories'));

const files = {
  'src/validators/admin.validator.ts': `import { z } from 'zod';
import { BoyStatus, GirlStatus, Role } from '@/constants/enums.constant';

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.union([
      z.nativeEnum(BoyStatus),
      z.nativeEnum(GirlStatus)
    ]),
    reason: z.string().optional(),
  }),
});

export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\\d+$/).optional().default('1'),
    limit: z.string().regex(/^\\d+$/).optional().default('20'),
    role: z.nativeEnum(Role).optional(),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
});
`,
  'src/repositories/adminUser.repository.ts': `import { User } from '@/models';
import { FilterQuery } from 'mongoose';
import { IUser } from '@/types/models.type';

class AdminUserRepository {
  async getPaginatedUsers(
    filters: { role?: string; status?: string; search?: string },
    page: number,
    limit: number
  ) {
    const query: FilterQuery<IUser> = { deletedAt: null };

    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password').exec(),
      User.countDocuments(query).exec(),
    ]);

    return { users, total };
  }
}

export const adminUserRepository = new AdminUserRepository();
`,
  'src/services/verification.service.ts': `import { userRepository } from '@/repositories/user.repository';
import { adminUserRepository } from '@/repositories/adminUser.repository';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { BoyStatus, GirlStatus, Role } from '@/constants/enums.constant';

class VerificationService {
  async getUsers(filters: any, page: number, limit: number) {
    return await adminUserRepository.getPaginatedUsers(filters, page, limit);
  }

  async getUserDetails(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
    }
    return user;
  }

  async updateUserStatus(userId: string, status: string, adminId: string, reason?: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
    }

    // Validate Status against Role
    const isValidBoyStatus = user.role === Role.BOY && Object.values(BoyStatus).includes(status as BoyStatus);
    const isValidGirlStatus = user.role === Role.GIRL && Object.values(GirlStatus).includes(status as GirlStatus);

    if (!isValidBoyStatus && !isValidGirlStatus) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, \`Invalid status '\${status}' for role '\${user.role}'\`, 'INVALID_STATUS');
    }

    const previousStatus = user.status;
    user.status = status as BoyStatus | GirlStatus;
    
    // Revoke token if suspended, banned, or rejected
    if (['SUSPENDED', 'BANNED', 'REJECTED'].includes(status)) {
      user.tokenVersion += 1;
    }

    await user.save();

    // Future Audit Logging: Save action to an AuditLogs collection
    // await auditLogRepository.create({ adminId, targetUserId: userId, action: 'UPDATE_STATUS', details: { from: previousStatus, to: status, reason } });

    return user;
  }
}

export const verificationService = new VerificationService();
`,
  'src/api/admin/admin.controller.ts': `import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { verificationService } from '@/services/verification.service';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, role, status, search } = req.query as any;
  
  const result = await verificationService.getUsers(
    { role, status, search },
    parseInt(page, 10),
    parseInt(limit, 10)
  );

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: result.users,
    message: 'Users retrieved',
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    },
  });
});

export const getUserDetails = asyncHandler(async (req: Request, res: Response) => {
  const user = await verificationService.getUserDetails(req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(user, 'User details retrieved'));
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, reason } = req.body;
  const adminId = (req as any).admin?.adminId || 'mock_admin_id'; // Ensure adminId is populated by middleware
  
  const updatedUser = await verificationService.updateUserStatus(req.params.id, status, adminId, reason);
  res.status(STATUS_CODES.OK).json(new ApiResponse(updatedUser, \`User status updated to \${status}\`));
});
`,
  'src/api/admin/admin.route.ts': `import { Router } from 'express';
import * as adminController from './admin.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAdminAuth } from '@/middlewares/adminAuth.middleware';
import { updateStatusSchema, getUsersQuerySchema } from '@/validators/admin.validator';

const router = Router();

// Apply admin authentication middleware to all admin routes
router.use(requireAdminAuth);

// Manage Users (including Girl Verification Flow)
router.get('/users', validate(getUsersQuerySchema), adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/status', validate(updateStatusSchema), adminController.updateUserStatus);

export default router;
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Admin Verification scaffolding complete.');
