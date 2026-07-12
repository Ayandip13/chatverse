import { Request, Response, NextFunction } from 'express';
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
