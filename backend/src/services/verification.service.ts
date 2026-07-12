import { userRepository } from '@/repositories/user.repository';
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
      throw new ApiError(STATUS_CODES.BAD_REQUEST, `Invalid status '${status}' for role '${user.role}'`, 'INVALID_STATUS');
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
