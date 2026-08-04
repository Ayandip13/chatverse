const fs = require("fs");
const path = require("path");

const backendDir = path.join(__dirname, "backend");

const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const dirs = [
  "src/validators",
  "src/repositories",
  "src/services",
  "src/api/auth",
  "src/middlewares",
  "src/utils",
].map((p) => path.join(backendDir, p));

dirs.forEach(mkDir);

const files = {
  "src/validators/auth.validator.ts": `import { z } from 'zod';
import { Role } from '@/constants/enums.constant';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.nativeEnum(Role),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'ID Token is required'),
    role: z.nativeEnum(Role).optional(), // Required only for registration
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});
`,
  "src/middlewares/validate.middleware.ts": `import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details,
          },
        });
      }
      next(error);
    }
  };
};
`,
  "src/repositories/user.repository.ts": `import { User } from '@/models';
import { IUser } from '@/types/models.type';

class UserRepository {
  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email, deletedAt: null });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, deletedAt: null }).exec();
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findOneAndUpdate({ _id: id, deletedAt: null }, updateData, { new: true }).exec();
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await User.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } }).exec();
  }
}

export const userRepository = new UserRepository();
`,
  "src/repositories/wallet.repository.ts": `import { Wallet } from '@/models';
import { IWallet } from '@/types/models.type';

class WalletRepository {
  async create(userId: string): Promise<IWallet> {
    return Wallet.create({ userId });
  }

  async findByUserId(userId: string): Promise<IWallet | null> {
    return Wallet.findOne({ userId }).exec();
  }
}

export const walletRepository = new WalletRepository();
`,
  "src/utils/jwt.util.ts": `import jwt from 'jsonwebtoken';
import envConfig from '@/config/env.config';
import { Types } from 'mongoose';
import { Role } from '@/constants/enums.constant';

export interface JwtPayload {
  userId: string;
  role: Role;
  tokenVersion: number;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, envConfig.JWT_SECRET, {
    expiresIn: envConfig.JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, envConfig.JWT_REFRESH_SECRET, {
    expiresIn: envConfig.JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, envConfig.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, envConfig.JWT_REFRESH_SECRET) as JwtPayload;
};
`,
  "src/services/auth.service.ts": `import { userRepository } from '@/repositories/user.repository';
import { walletRepository } from '@/repositories/wallet.repository';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { Role, BoyStatus, GirlStatus } from '@/constants/enums.constant';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt.util';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

class AuthService {
  async register(data: any) {
    const { email, password, role, name, phone } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'Email is already registered', 'EMAIL_IN_USE');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const status = role === Role.BOY ? BoyStatus.ACTIVE : GirlStatus.PENDING;

    const user = await userRepository.create({
      email,
      password: hashedPassword,
      role,
      name,
      phone,
      status,
      authProvider: 'LOCAL',
    });

    await walletRepository.create(user.id);

    const payload = {
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async login(data: any) {
    const { email, password } = data;

    const user = await userRepository.findByEmail(email, true);
    if (!user || !user.password) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    this.checkUserStatus(user);

    const payload = {
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async googleLogin(idToken: string, role?: Role) {
    // In a real application, you would verify the idToken with Google's OAuth2Client
    // For this implementation, we will mock the verification and assume the token is the user's email
    // This is because we don't have Google client ID configured.
    const email = idToken; // MOCK
    const name = "Google User"; // MOCK
    
    let user = await userRepository.findByEmail(email);
    
    if (!user) {
      if (!role) {
        throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Role is required for registration', 'ROLE_REQUIRED');
      }
      const status = role === Role.BOY ? BoyStatus.ACTIVE : GirlStatus.PENDING;
      user = await userRepository.create({
        email,
        name,
        role,
        status,
        authProvider: 'GOOGLE',
      });
      await walletRepository.create(user.id);
    }

    this.checkUserStatus(user);

    const payload = {
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async refresh(token: string) {
    try {
      const decoded = await import('@/utils/jwt.util').then(m => m.verifyRefreshToken(token));
      const user = await userRepository.findById(decoded.userId);
      
      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid refresh token', 'UNAUTHORIZED');
      }

      this.checkUserStatus(user);

      const payload = {
        userId: user.id,
        role: user.role,
        tokenVersion: user.tokenVersion,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid or expired refresh token', 'TOKEN_EXPIRED');
    }
  }

  async logout(userId: string) {
    await userRepository.incrementTokenVersion(userId);
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return; // Do not reveal if user exists
    }
    // In a real app, generate a reset token, save it to DB or Redis, and send email.
    // For now, we simulate this.
  }

  async resetPassword(token: string, newPassword: string) {
    // Validate token and find user. Simulated here.
    // Hash new password and update user.
    // await userRepository.incrementTokenVersion(userId);
  }

  private checkUserStatus(user: any) {
    if (user.status === BoyStatus.BANNED || user.status === GirlStatus.BANNED) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'User is banned', 'USER_BANNED');
    }
    if (user.status === BoyStatus.SUSPENDED || user.status === GirlStatus.SUSPENDED) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'User is suspended', 'USER_SUSPENDED');
    }
    if (user.status === GirlStatus.REJECTED) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'Application rejected', 'GIRL_REJECTED');
    }
    // PENDING girls are allowed to login to see the pending screen.
  }

  private sanitizeUser(user: any) {
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }
}

export const authService = new AuthService();
`,
  "src/api/auth/auth.controller.ts": `import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { authService } from '@/services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(STATUS_CODES.CREATED).json(new ApiResponse(result, 'Registration successful'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Login successful'));
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, role } = req.body;
  const result = await authService.googleLogin(idToken, role);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Google login successful'));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) {
    res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
    return;
  }
  const result = await authService.refresh(token);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Token refreshed'));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await authService.logout(req.user.userId);
  }
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Logged out successfully'));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Password reset email sent (if account exists)'));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  res.status(STATUS_CODES.OK).json(new ApiResponse(null, 'Password has been reset'));
});
`,
  "src/api/auth/auth.route.ts": `import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth } from '@/middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleAuthSchema), authController.googleLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
`,
  "src/middlewares/auth.middleware.ts": `import { Request, Response, NextFunction } from 'express';
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
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, "utf8");
}
console.log("Auth scaffolding complete.");
