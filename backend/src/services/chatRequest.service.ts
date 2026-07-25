import { chatRequestRepository } from '@/repositories/chatRequest.repository';
import { chatRepository } from '@/repositories/chat.repository';
import { userRepository } from '@/repositories/user.repository';
import { walletRepository } from '@/repositories/wallet.repository';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { ChatRequestStatus, Role, GirlStatus, BoyStatus } from '@/constants/enums.constant';
import { isUserOnline } from '@/sockets/handlers/presence.handler';
import logger from '@/config/logger.config';

const getSocketIO = () => {
  try {
    const { getIO } = require('@/sockets');
    return getIO();
  } catch (err) {
    return null;
  }
};

class ChatRequestService {
  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'You cannot send a request to yourself');
    }

    const sender = await userRepository.findById(senderId);
    if (!sender || sender.role !== Role.BOY) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'Only boys can send chat requests', 'FORBIDDEN');
    }
    if (sender.status !== BoyStatus.ACTIVE) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'Your account is not active', 'USER_SUSPENDED');
    }

    const receiver = await userRepository.findById(receiverId);
    if (!receiver || receiver.role !== Role.GIRL) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'You can only send requests to girls', 'INVALID_TARGET');
    }
    if (receiver.status !== GirlStatus.APPROVED) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'This girl is not approved to receive requests', 'GIRL_NOT_APPROVED');
    }

    // Check Wallet Balance (Minimum 10 coins)
    let wallet = await walletRepository.findByUserId(senderId);
    if (!wallet) {
      wallet = await walletRepository.create(senderId);
    }
    if (wallet.currentBalance < 10) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        'Insufficient wallet balance. You need at least 10 coins to request a chat.',
        'INSUFFICIENT_FUNDS'
      );
    }

    // Check Girl Online Status
    const isOnline = isUserOnline(receiverId) || (receiver.updatedAt && new Date(receiver.updatedAt).getTime() > Date.now() - 15 * 60000);
    if (!isOnline) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        'This creator is currently offline. You can only send chat requests to online creators.',
        'GIRL_OFFLINE'
      );
    }

    // Check for duplicate pending request
    const existingRequest = await chatRequestRepository.findPendingRequest(senderId, receiverId);
    if (existingRequest) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'You already have a pending request to this girl', 'DUPLICATE_REQUEST');
    }

    // Check for existing active chat
    const activeChat = await chatRepository.findActiveChat(senderId, receiverId);
    if (activeChat) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'You already have an active chat session with this girl', 'CHAT_ALREADY_ACTIVE');
    }

    const request = await chatRequestRepository.create(senderId, receiverId);

    // Emit Realtime Event to Girl personal room
    const io = getSocketIO();
    const payload = {
      requestId: request._id.toString(),
      sender: {
        _id: sender._id.toString(),
        name: sender.name,
        avatar: sender.avatar,
      },
      receiverId,
      createdAt: request.createdAt,
    };

    if (io) {
      io.to(`user:${receiverId}`).emit('chat_request:receive', payload);
      io.to(`user:${receiverId}`).emit('chat_request:new', payload);
    }

    // Schedule 60s Expiration Timeout
    setTimeout(async () => {
      try {
        const checkReq = await chatRequestRepository.findById(request._id.toString());
        if (checkReq && checkReq.status === ChatRequestStatus.PENDING) {
          await chatRequestRepository.updateStatus(request._id.toString(), ChatRequestStatus.EXPIRED);
          logger.info(`Chat request ${request._id} auto-expired after 60s`);
          const currentIo = getSocketIO();
          if (currentIo) {
            const expPayload = { requestId: request._id.toString(), reason: 'TIMEOUT' };
            currentIo.to(`user:${senderId}`).emit('chat_request:expired', expPayload);
            currentIo.to(`user:${receiverId}`).emit('chat_request:expired', expPayload);
          }
        }
      } catch (err) {
        logger.error(`Error in chat request expiration timeout: ${(err as Error).message}`);
      }
    }, 60000);

    return request;
  }

  async acceptRequest(receiverId: string, requestId: string) {
    const request = await chatRequestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Chat request not found', 'NOT_FOUND');
    }
    if (request.receiverId.toString() !== receiverId) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'You can only accept your own requests', 'UNAUTHORIZED');
    }
    if (request.status !== ChatRequestStatus.PENDING) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, `Request cannot be accepted as it is ${request.status}`, 'INVALID_STATE');
    }

    // Ensure girl is still approved
    const receiver = await userRepository.findById(receiverId);
    if (!receiver || receiver.status !== GirlStatus.APPROVED) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'Your account is not approved to accept requests', 'GIRL_NOT_APPROVED');
    }

    // Re-verify Boy's balance
    const wallet = await walletRepository.findByUserId(request.senderId.toString());
    if (!wallet || wallet.currentBalance < 10) {
      await chatRequestRepository.updateStatus(requestId, ChatRequestStatus.EXPIRED);
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Sender balance is insufficient for chat', 'INSUFFICIENT_FUNDS');
    }

    // Update Request Status
    const updatedRequest = await chatRequestRepository.updateStatus(requestId, ChatRequestStatus.ACCEPTED);
    
    // Create Active Chat
    const activeChat = await chatRepository.create(
      request.senderId.toString(),
      receiverId,
      requestId
    );

    const io = getSocketIO();
    if (io) {
      const acceptedPayload = {
        requestId,
        chatId: activeChat._id.toString(),
        boyId: request.senderId.toString(),
        girlId: receiverId,
      };

      io.to(`user:${request.senderId.toString()}`).emit('chat_request:accepted', acceptedPayload);
      io.to(`user:${receiverId}`).emit('chat_request:accepted', acceptedPayload);
      io.to(`user:${request.senderId.toString()}`).emit('chat:started', { chatId: activeChat._id.toString() });
      io.to(`user:${receiverId}`).emit('chat:started', { chatId: activeChat._id.toString() });
    }

    return { request: updatedRequest, chat: activeChat };
  }

  async rejectRequest(receiverId: string, requestId: string) {
    const request = await chatRequestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Chat request not found', 'NOT_FOUND');
    }
    if (request.receiverId.toString() !== receiverId) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'You can only reject your own requests', 'UNAUTHORIZED');
    }
    if (request.status !== ChatRequestStatus.PENDING) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, `Request cannot be rejected as it is ${request.status}`, 'INVALID_STATE');
    }

    const updated = await chatRequestRepository.updateStatus(requestId, ChatRequestStatus.REJECTED);

    const io = getSocketIO();
    if (io) {
      const rejectedPayload = { requestId, girlId: receiverId };
      io.to(`user:${request.senderId.toString()}`).emit('chat_request:rejected', rejectedPayload);
    }

    return updated;
  }

  async cancelRequest(senderId: string, requestId: string) {
    const request = await chatRequestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Chat request not found', 'NOT_FOUND');
    }
    if (request.senderId.toString() !== senderId) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'You can only cancel your own requests', 'UNAUTHORIZED');
    }
    if (request.status !== ChatRequestStatus.PENDING) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, `Request cannot be cancelled as it is ${request.status}`, 'INVALID_STATE');
    }

    const updated = await chatRequestRepository.updateStatus(requestId, ChatRequestStatus.CANCELLED);

    const io = getSocketIO();
    if (io) {
      const cancelledPayload = { requestId, boyId: senderId };
      io.to(`user:${request.receiverId.toString()}`).emit('chat_request:cancelled', cancelledPayload);
    }

    return updated;
  }

  async getRequests(userId: string, role: 'BOY' | 'GIRL', filters: any, page: number, limit: number) {
    return await chatRequestRepository.getPaginatedRequests(userId, role, filters, page, limit);
  }
}

export const chatRequestService = new ChatRequestService();
