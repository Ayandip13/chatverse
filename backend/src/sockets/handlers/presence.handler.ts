import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@/middlewares/socketAuth.middleware';
import { User } from '@/models';
import logger from '@/config/logger.config';

export const registerPresenceHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user!.userId;

  // Personal room for direct updates (like wallet)
  socket.join(`user:${userId}`);

  socket.on('presence:online', async () => {
    logger.info(`User ${userId} is online`);
    // In a real Redis setup, you'd store this in a hash map for fast global lookup.
    // We emit to all since a user might be favored.
    io.emit('presence:update', { userId, status: 'ONLINE' });
  });

  socket.on('disconnect', async () => {
    logger.info(`User ${userId} disconnected (Socket ${socket.id})`);
    
    // Broadcast offline status immediately
    io.emit('presence:update', { userId, status: 'OFFLINE', lastSeen: new Date() });
    
    // Note: If they reconnect within the pingTimeout, Socket.IO handles it implicitly.
    // If we wanted to pause billing on disconnect, we would hook into chatSessionService here,
    // but typically billing continues until the chat is explicitly ended by a user or zero balance.
  });
};

export const isUserOnline = (userId: string): boolean => {
  try {
    const { getIO } = require('@/sockets');
    const io = getIO();
    const room = io.sockets.adapter.rooms.get(`user:${userId}`);
    return !!(room && room.size > 0);
  } catch (error) {
    return false;
  }
};
