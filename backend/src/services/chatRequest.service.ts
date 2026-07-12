import { chatRequestRepository } from '@/repositories/chatRequest.repository';
import { chatRepository } from '@/repositories/chat.repository';
import { userRepository } from '@/repositories/user.repository';
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { ChatRequestStatus, Role, GirlStatus, BoyStatus } from '@/constants/enums.constant';

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

    // Check for duplicate active/pending request
    const existingRequest = await chatRequestRepository.findPendingRequest(senderId, receiverId);
    if (existingRequest) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'You already have a pending request to this girl', 'DUPLICATE_REQUEST');
    }

    return await chatRequestRepository.create(senderId, receiverId);
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

    // Update Request
    const updatedRequest = await chatRequestRepository.updateStatus(requestId, ChatRequestStatus.ACCEPTED);
    
    // Create Active Chat
    const activeChat = await chatRepository.create(
      request.senderId.toString(),
      receiverId,
      requestId
    );

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

    return await chatRequestRepository.updateStatus(requestId, ChatRequestStatus.REJECTED);
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

    return await chatRequestRepository.updateStatus(requestId, ChatRequestStatus.CANCELLED);
  }

  async getRequests(userId: string, role: 'BOY' | 'GIRL', filters: any, page: number, limit: number) {
    return await chatRequestRepository.getPaginatedRequests(userId, role, filters, page, limit);
  }
}

export const chatRequestService = new ChatRequestService();
