import { Socket } from 'socket.io';
import { verifyAccessToken, JwtPayload } from '@/utils/jwt.util';
import { userRepository } from '@/repositories/user.repository';
import logger from '@/config/logger.config';

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = verifyAccessToken(token);
    const user = await userRepository.findById(decoded.userId);

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return next(new Error('Authentication error: Token invalid or expired'));
    }

    socket.user = decoded;
    next();
  } catch (error) {
    logger.error(`Socket Auth Error: ${(error as Error).message}`);
    next(new Error('Authentication error'));
  }
};
