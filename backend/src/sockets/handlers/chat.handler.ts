import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@/middlewares/socketAuth.middleware';
import { messageService } from '@/services/message.service';
import { chatSessionService } from '@/services/chatSession.service';
import logger from '@/config/logger.config';
import { Chat } from '@/models';
import { ChatStatus } from '@/constants/enums.constant';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user!.userId;

  // Track joined chat rooms for disconnect handling
  const joinedRooms = new Set<string>();

  socket.on('chat:join', async (payload: { chatId: string }, callback) => {
    try {
      const { chatId } = payload;
      const chat = await Chat.findById(chatId);
      
      if (!chat) {
        if (callback) callback({ error: 'Chat not found' });
        return;
      }

      if (chat.boyId.toString() !== userId && chat.girlId.toString() !== userId) {
        if (callback) callback({ error: 'Unauthorized room access' });
        return;
      }

      socket.join(`chat:${chatId}`);
      joinedRooms.add(chatId);
      logger.info(`User ${userId} joined chat room ${chatId}`);

      // Notify session service that participant entered room
      if (chat.status === ChatStatus.ACTIVE) {
        await chatSessionService.onParticipantJoined(chatId, userId, io);
      }

      if (callback) callback({ success: true });
    } catch (error) {
      if (callback) callback({ error: (error as Error).message });
    }
  });

  socket.on('chat:leave', (payload: { chatId: string }) => {
    const { chatId } = payload;
    socket.leave(`chat:${chatId}`);
    joinedRooms.delete(chatId);
    chatSessionService.onParticipantLeft(chatId, userId, io);
  });

  socket.on('chat:end_session', async (payload: { chatId: string }, callback) => {
    try {
      const { chatId } = payload;
      const chat = await Chat.findById(chatId);
      
      if (!chat) {
        if (callback) callback({ error: 'Chat not found' });
        return;
      }
      
      if (chat.girlId.toString() !== userId) {
        if (callback) callback({ error: 'Unauthorized: Only girls can end chat sessions' });
        return;
      }

      logger.info(`User ${userId} requested manual end of chat ${chatId}`);
      await chatSessionService.stopChatSession(chatId, io, 'MANUAL');
      if (callback) callback({ success: true });
    } catch (error: any) {
      if (callback) callback({ error: error.message });
    }
  });

  socket.on('chat:send_message', async (payload: { chatId: string; content: string; tempId?: string }, callback) => {
    try {
      const { chatId, content, tempId } = payload;

      const canSend = await chatSessionService.processMessageDeduction(chatId, userId, io);
      if (!canSend) {
        if (callback) callback({ error: 'Insufficient coins to send a message', tempId });
        return;
      }
      
      // Validates against regex and persists
      const message = await messageService.validateAndSaveMessage(chatId, userId, content);

      // Broadcast to room (excluding sender)
      socket.to(`chat:${chatId}`).emit('chat:receive_message', {
        _id: message._id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      });

      if (callback) callback({ success: true, message, tempId });
    } catch (error: any) {
      logger.error(`Message Error: ${error.message}`);
      if (callback) callback({ error: error.message, tempId: payload.tempId });
    }
  });

  socket.on('chat:typing_start', (payload: { chatId: string }) => {
    socket.to(`chat:${payload.chatId}`).emit('chat:typing_start', { chatId: payload.chatId, userId });
  });

  socket.on('chat:typing_stop', (payload: { chatId: string }) => {
    socket.to(`chat:${payload.chatId}`).emit('chat:typing_stop', { chatId: payload.chatId, userId });
  });

  socket.on('chat:read', (payload: { chatId: string; messageId: string }) => {
    socket.to(`chat:${payload.chatId}`).emit('chat:read_receipt', { chatId: payload.chatId, messageId: payload.messageId, userId });
  });

  // Handle socket disconnect for active rooms
  socket.on('disconnect', () => {
    joinedRooms.forEach((chatId) => {
      chatSessionService.onParticipantLeft(chatId, userId, io);
    });
  });
};
