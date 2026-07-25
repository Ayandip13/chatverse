import { userRepository } from '@/repositories/user.repository';
import { walletRepository } from '@/repositories/wallet.repository';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { Role, BoyStatus, GirlStatus } from '@/constants/enums.constant';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt.util';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

class AuthService {
  async register(data: any) {
    const { email, password, role, name, phone, bio } = data;

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
      bio,
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
