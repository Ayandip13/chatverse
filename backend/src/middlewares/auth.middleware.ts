import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '@/utils/jwt.util';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { Role } from '@/constants/enums.constant';
import { userRepository } from '@/repositories/user.repository';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Authentication required', 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await userRepository.findById(decoded.userId);
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Token is invalid or expired', 'TOKEN_EXPIRED');
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(new ApiError(STATUS_CODES.UNAUTHORIZED, 'Authentication failed', 'UNAUTHORIZED'));
  }
};

export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError(STATUS_CODES.FORBIDDEN, 'Forbidden resource', 'FORBIDDEN'));
      return;
    }
    next();
  };
};
