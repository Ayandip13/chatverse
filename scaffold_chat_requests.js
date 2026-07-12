const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

mkDir(path.join(backendDir, 'src/api/chat-requests'));
mkDir(path.join(backendDir, 'src/validators'));
mkDir(path.join(backendDir, 'src/services'));
mkDir(path.join(backendDir, 'src/repositories'));

const files = {
  'src/validators/chatRequest.validator.ts': `import { z } from 'zod';

export const sendChatRequestSchema = z.object({
  body: z.object({
    targetUserId: z.string().min(1, 'Target User ID is required'),
  }),
});

export const getRequestsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\\d+$/).optional().default('1'),
    limit: z.string().regex(/^\\d+$/).optional().default('20'),
    status: z.string().optional(), // Can filter by PENDING, ACCEPTED, etc.
  }),
});
`,
  'src/repositories/chatRequest.repository.ts': `import { ChatRequest } from '@/models';
import { IChatRequest } from '@/types/models.type';
import { ChatRequestStatus } from '@/constants/enums.constant';
import { FilterQuery, Types } from 'mongoose';

class ChatRequestRepository {
  async create(senderId: string, receiverId: string): Promise<IChatRequest> {
    return ChatRequest.create({ senderId, receiverId, status: ChatRequestStatus.PENDING });
  }

  async findById(id: string): Promise<IChatRequest | null> {
    return ChatRequest.findById(id).exec();
  }

  async findPendingRequest(senderId: string, receiverId: string): Promise<IChatRequest | null> {
    return ChatRequest.findOne({ senderId, receiverId, status: ChatRequestStatus.PENDING }).exec();
  }

  async updateStatus(id: string, status: ChatRequestStatus): Promise<IChatRequest | null> {
    return ChatRequest.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async getPaginatedRequests(
    userId: string,
    role: 'BOY' | 'GIRL',
    filters: { status?: string },
    page: number,
    limit: number
  ) {
    const query: FilterQuery<IChatRequest> = {};
    if (role === 'BOY') {
      query.senderId = new Types.ObjectId(userId);
    } else {
      query.receiverId = new Types.ObjectId(userId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      ChatRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('senderId receiverId', 'name avatar role status').exec(),
      ChatRequest.countDocuments(query).exec(),
    ]);

    return { requests, total };
  }
}

export const chatRequestRepository = new ChatRequestRepository();
`,
  'src/repositories/chat.repository.ts': `import { Chat } from '@/models';
import { IChat } from '@/types/models.type';
import { ChatStatus } from '@/constants/enums.constant';

class ChatRepository {
  async create(boyId: string, girlId: string, chatRequestId: string): Promise<IChat> {
    return Chat.create({ boyId, girlId, chatRequestId, status: ChatStatus.ACTIVE });
  }
}

export const chatRepository = new ChatRepository();
`,
  'src/services/chatRequest.service.ts': `import { chatRequestRepository } from '@/repositories/chatRequest.repository';
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
      throw new ApiError(STATUS_CODES.BAD_REQUEST, \`Request cannot be accepted as it is \${request.status}\`, 'INVALID_STATE');
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
      throw new ApiError(STATUS_CODES.BAD_REQUEST, \`Request cannot be rejected as it is \${request.status}\`, 'INVALID_STATE');
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
      throw new ApiError(STATUS_CODES.BAD_REQUEST, \`Request cannot be cancelled as it is \${request.status}\`, 'INVALID_STATE');
    }

    return await chatRequestRepository.updateStatus(requestId, ChatRequestStatus.CANCELLED);
  }

  async getRequests(userId: string, role: 'BOY' | 'GIRL', filters: any, page: number, limit: number) {
    return await chatRequestRepository.getPaginatedRequests(userId, role, filters, page, limit);
  }
}

export const chatRequestService = new ChatRequestService();
`,
  'src/api/chat-requests/chatRequest.controller.ts': `import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.util';
import { ApiResponse } from '@/utils/ApiResponse.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { chatRequestService } from '@/services/chatRequest.service';

export const sendRequest = asyncHandler(async (req: Request, res: Response) => {
  const { targetUserId } = req.body;
  const result = await chatRequestService.sendRequest(req.user!.userId, targetUserId);
  res.status(STATUS_CODES.CREATED).json(new ApiResponse(result, 'Chat request sent successfully'));
});

export const acceptRequest = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatRequestService.acceptRequest(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Chat request accepted and chat started'));
});

export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatRequestService.rejectRequest(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Chat request rejected'));
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatRequestService.cancelRequest(req.user!.userId, req.params.id);
  res.status(STATUS_CODES.OK).json(new ApiResponse(result, 'Chat request cancelled'));
});

export const getRequests = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as any;
  const result = await chatRequestService.getRequests(
    req.user!.userId,
    req.user!.role as 'BOY' | 'GIRL',
    { status },
    parseInt(page, 10),
    parseInt(limit, 10)
  );

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: result.requests,
    message: 'Chat requests retrieved',
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    },
  });
});
`,
  'src/api/chat-requests/chatRequest.route.ts': `import { Router } from 'express';
import * as chatRequestController from './chatRequest.controller';
import { validate } from '@/middlewares/validate.middleware';
import { requireAuth, requireRole } from '@/middlewares/auth.middleware';
import { sendChatRequestSchema, getRequestsQuerySchema } from '@/validators/chatRequest.validator';
import { Role } from '@/constants/enums.constant';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole([Role.BOY]), validate(sendChatRequestSchema), chatRequestController.sendRequest);
router.post('/:id/accept', requireRole([Role.GIRL]), chatRequestController.acceptRequest);
router.post('/:id/reject', requireRole([Role.GIRL]), chatRequestController.rejectRequest);
router.post('/:id/cancel', requireRole([Role.BOY]), chatRequestController.cancelRequest);
router.get('/', validate(getRequestsQuerySchema), chatRequestController.getRequests);

export default router;
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Chat Request scaffolding complete.');
