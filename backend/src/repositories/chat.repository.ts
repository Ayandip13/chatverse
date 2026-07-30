import { Chat } from '@/models';
import { IChat } from '@/types/models.type';
import { ChatStatus } from '@/constants/enums.constant';

class ChatRepository {
  async create(boyId: string, girlId: string, chatRequestId: string): Promise<IChat> {
    const existing = await Chat.findOne({ boyId, girlId, deletedAt: null }).exec();
    if (existing) {
      existing.status = ChatStatus.ACTIVE;
      existing.chatRequestId = chatRequestId as any;
      existing.startTime = new Date();
      existing.updatedAt = new Date();
      return existing.save();
    }
    return Chat.create({ boyId, girlId, chatRequestId, status: ChatStatus.ACTIVE });
  }

  async findActiveChat(boyId: string, girlId: string): Promise<IChat | null> {
    return Chat.findOne({ boyId, girlId, status: ChatStatus.ACTIVE, deletedAt: null }).exec();
  }

  async findExistingChat(boyId: string, girlId: string): Promise<IChat | null> {
    return Chat.findOne({ boyId, girlId, deletedAt: null }).exec();
  }
}

export const chatRepository = new ChatRepository();
