import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt.util';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { User, Admin } from '@/models';

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

    const targetId = decoded.adminId || decoded.userId;
    let adminDoc: any = await User.findById(targetId);

    if (!adminDoc || adminDoc.role !== 'ADMIN') {
      adminDoc = await Admin.findById(targetId);
    }

    if (!adminDoc || adminDoc.tokenVersion !== decoded.tokenVersion) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid or expired admin token', 'TOKEN_EXPIRED');
    }

    (req as any).admin = { adminId: adminDoc._id.toString(), role: 'ADMIN', email: adminDoc.email };
    next();
  } catch (error) {
    next(new ApiError(STATUS_CODES.UNAUTHORIZED, 'Admin authentication failed', 'UNAUTHORIZED'));
  }
};
