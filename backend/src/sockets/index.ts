import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import envConfig from '@/config/env.config';
import logger from '@/config/logger.config';
import { socketAuthMiddleware, AuthenticatedSocket } from '@/middlewares/socketAuth.middleware';
import { registerChatHandlers } from './handlers/chat.handler';
import { registerPresenceHandlers } from './handlers/presence.handler';
import { registerChatRequestHandlers } from './handlers/chatRequest.handler';
import { chatSessionService } from '@/services/chatSession.service';

let io: SocketIOServer;

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const initializeSocket = (server: HttpServer): void => {
  io = new SocketIOServer(server, {
    cors: {
      origin: envConfig.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  // Attach Authentication Middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Authenticated Socket Connected: ${socket.id} for User: ${socket.user?.userId}`);

    // Register Handlers
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerChatRequestHandlers(io, socket);

    // Initial join room is handled in presence handler (user:<id>)
  });

  // Recover active sessions on server startup
  chatSessionService.recoverActiveSessions(io);
};
