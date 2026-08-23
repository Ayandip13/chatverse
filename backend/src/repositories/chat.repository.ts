import { Chat } from '@/models';
import { IChat } from '@/types/models.type';
import { ChatStatus } from '@/constants/enums.constant';

class ChatRepository {
  async create(boyId: string, girlId: string, chatRequestId: string): Promise<IChat> {
    const existing = await Chat.findOne({ boyId, girlId, deletedAt: null }).exec();
    if (existing) {
      const updated = await Chat.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            status: ChatStatus.ACTIVE,
            chatRequestId: chatRequestId as any,
            durationInMinutes: 0,
            totalCost: 0,
            updatedAt: new Date(),
          },
          $unset: { startTime: 1, endTime: 1 },
        },
        { new: true }
      ).exec();
      return (updated || existing) as IChat;
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
