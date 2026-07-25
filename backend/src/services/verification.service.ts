import { userRepository } from '@/repositories/user.repository';
import { adminUserRepository } from '@/repositories/adminUser.repository';
import { notificationRepository } from '@/repositories/notification.repository';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { BoyStatus, GirlStatus, Role, NotificationStatus } from '@/constants/enums.constant';
import { Types } from 'mongoose';

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

    user.status = status as BoyStatus | GirlStatus;
    user.verifiedAt = new Date();
    
    if (adminId && Types.ObjectId.isValid(adminId) && /^[0-9a-fA-F]{24}$/.test(adminId)) {
      user.verifiedByAdminId = new Types.ObjectId(adminId);
    }

    if (reason) {
      user.statusReason = reason;
    }
    if (status === 'REJECTED' && reason) {
      user.rejectionReason = reason;
    }

    // Revoke token if suspended, banned, or rejected
    if (['SUSPENDED', 'BANNED', 'REJECTED'].includes(status)) {
      user.tokenVersion += 1;
    }

    await user.save();

    // Create Notification for the user
    let notifTitle = 'Account Status Update';
    let notifBody = `Your account status has been changed to ${status}.`;

    if (status === 'APPROVED') {
      notifTitle = 'Account Approved!';
      notifBody = 'Congratulations! Your creator account has been approved by administration. You can now access all features.';
    } else if (status === 'REJECTED') {
      notifTitle = 'Application Not Approved';
      notifBody = `Your creator application was rejected.${reason ? ` Reason: ${reason}` : ''}`;
    } else if (status === 'SUSPENDED') {
      notifTitle = 'Account Suspended';
      notifBody = `Your account has been suspended by administration.${reason ? ` Reason: ${reason}` : ''}`;
    }

    try {
      await notificationRepository.create({
        userId: user._id,
        title: notifTitle,
        body: notifBody,
        status: NotificationStatus.UNREAD,
        type: 'VERIFICATION_UPDATE',
      });
    } catch (notifErr) {
      console.warn('Failed to create verification update notification:', notifErr);
    }

    return user;
  }
}

export const verificationService = new VerificationService();
