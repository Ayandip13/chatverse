import { Chat } from '@/models';
import { IChat } from '@/types/models.type';
import { ChatStatus } from '@/constants/enums.constant';

class ChatRepository {
  async create(boyId: string, girlId: string, chatRequestId: string): Promise<IChat> {
    return Chat.create({ boyId, girlId, chatRequestId, status: ChatStatus.ACTIVE });
  }
}

export const chatRepository = new ChatRepository();
