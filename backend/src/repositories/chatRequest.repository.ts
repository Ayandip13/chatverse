import { ChatRequest } from '@/models';
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
    limit: number,
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
      ChatRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId receiverId', 'name avatar role status')
        .exec(),
      ChatRequest.countDocuments(query).exec(),
    ]);

    return { requests, total };
  }
}

export const chatRequestRepository = new ChatRequestRepository();
