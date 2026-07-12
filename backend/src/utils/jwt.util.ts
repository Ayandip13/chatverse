import jwt from 'jsonwebtoken';
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
    expiresIn: envConfig.JWT_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, envConfig.JWT_REFRESH_SECRET, {
    expiresIn: envConfig.JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, envConfig.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, envConfig.JWT_REFRESH_SECRET) as JwtPayload;
};
