import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@/middlewares/socketAuth.middleware';
import { messageService } from '@/services/message.service';
import { chatSessionService } from '@/services/chatSession.service';
import logger from '@/config/logger.config';
import { Chat, Message } from '@/models';
import { ChatStatus } from '@/constants/enums.constant';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;
  if (!userId) return;

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

  socket.on('chat:deduct_session_coins', async (payload: { chatId: string }, callback) => {
    try {
      const { chatId } = payload;
      logger.info(`User ${userId} 2-minute chat session complete for ${chatId}, deducting 2 coins...`);
      await chatSessionService.processTwoMinuteDeduction(chatId, io);
      if (callback) callback({ success: true });
    } catch (error: any) {
      logger.error(`Session coin deduction failed: ${error.message}`);
      if (callback) callback({ error: error.message });
    }
  });

  socket.on('chat:send_message', async (payload: { chatId: string; content: string; tempId?: string }, callback) => {
    try {
      const { chatId, content, tempId } = payload;

      // Cheap pre-check: boys must have >= 1 coin, girls always send free.
      const canSend = await chatSessionService.canSendMessage(chatId, userId);
      if (!canSend) {
        if (callback) callback({ error: 'Insufficient coins to send a message', tempId });
        return;
      }

      // Validates against regex and persists the message FIRST
      const message = await messageService.validateAndSaveMessage(chatId, userId, content);

      // Check if recipient is online in this chat room
      const room = io.sockets.adapter.rooms.get(`chat:${chatId}`);
      const isRecipientInRoom = room && room.size > 1;
      const initialStatus: 'SENT' | 'DELIVERED' = isRecipientInRoom ? 'DELIVERED' : 'SENT';

      if (isRecipientInRoom) {
        await Message.findByIdAndUpdate(message._id, { status: 'DELIVERED' });
      }

      // Broadcast to room
      socket.to(`chat:${chatId}`).emit('chat:receive_message', {
        _id: message._id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        status: initialStatus,
        createdAt: message.createdAt,
      });

      if (callback) callback({ success: true, message: { ...message.toObject(), status: initialStatus }, tempId });
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

  socket.on('chat:read', async (payload: { chatId: string; messageId?: string }) => {
    try {
      const { chatId, messageId } = payload;
      if (messageId) {
        await Message.findByIdAndUpdate(messageId, { status: 'READ' });
      } else {
        await Message.updateMany(
          { chatId, senderId: { $ne: userId }, status: { $ne: 'READ' } },
          { status: 'READ' }
        );
      }

      io.to(`chat:${chatId}`).emit('chat:message_status_update', {
        chatId,
        messageId,
        status: 'READ',
        readBy: userId,
      });
    } catch (error: any) {
      logger.error(`Read status error: ${error.message}`);
    }
  });

  // Handle socket disconnect for active rooms
  socket.on('disconnect', () => {
    joinedRooms.forEach((chatId) => {
      chatSessionService.onParticipantLeft(chatId, userId, io);
    });
  });
};
