import { Message } from '@/models';
import { IMessage } from '@/types/models.type';
import { Types } from 'mongoose';

class MessageRepository {
  async create(chatId: string, senderId: string, content: string): Promise<IMessage> {
    return Message.create({
      chatId: new Types.ObjectId(chatId),
      senderId: new Types.ObjectId(senderId),
      content,
    });
  }

  async getMessagesByChatId(chatId: string, limit = 50, skip = 0) {
    return Message.find({ chatId: new Types.ObjectId(chatId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

export const messageRepository = new MessageRepository();
