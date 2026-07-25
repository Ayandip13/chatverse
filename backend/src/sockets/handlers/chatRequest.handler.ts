import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@/middlewares/socketAuth.middleware';
import { chatRequestService } from '@/services/chatRequest.service';
import logger from '@/config/logger.config';

export const registerChatRequestHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user!.userId;

  // chat_request:send
  socket.on('chat_request:send', async (payload: { targetId: string }, callback) => {
    try {
      const request = await chatRequestService.sendRequest(userId, payload.targetId);
      if (callback) callback({ success: true, requestId: request._id.toString() });
    } catch (error: any) {
      logger.error(`Socket chat_request:send error: ${error.message}`);
      if (callback) callback({ success: false, error: error.message, code: error.code || 'REQUEST_FAILED' });
    }
  });

  // chat_request:accept
  socket.on('chat_request:accept', async (payload: { requestId: string }, callback) => {
    try {
      const result = await chatRequestService.acceptRequest(userId, payload.requestId);
      if (callback) callback({ success: true, chatId: result.chat._id.toString() });
    } catch (error: any) {
      logger.error(`Socket chat_request:accept error: ${error.message}`);
      if (callback) callback({ success: false, error: error.message, code: error.code || 'ACCEPT_FAILED' });
    }
  });

  // chat_request:reject
  socket.on('chat_request:reject', async (payload: { requestId: string }, callback) => {
    try {
      await chatRequestService.rejectRequest(userId, payload.requestId);
      if (callback) callback({ success: true });
    } catch (error: any) {
      logger.error(`Socket chat_request:reject error: ${error.message}`);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // chat_request:cancel
  socket.on('chat_request:cancel', async (payload: { requestId: string }, callback) => {
    try {
      await chatRequestService.cancelRequest(userId, payload.requestId);
      if (callback) callback({ success: true });
    } catch (error: any) {
      logger.error(`Socket chat_request:cancel error: ${error.message}`);
      if (callback) callback({ success: false, error: error.message });
    }
  });
};
