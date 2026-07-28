import { messageRepository } from '@/repositories/message.repository';
import { chatRepository } from '@/repositories/chat.repository'; // Assume this has a findById method
import { Chat } from '@/models'; // fallback
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { ChatStatus } from '@/constants/enums.constant';

class MessageService {
  private readonly BLOCKED_PATTERNS = [
    /\b\d{10}\b/, // Phone Numbers
    /wa\.me|whatsapp/i, // WhatsApp
    /t\.me|telegram/i, // Telegram
    /instagram\.com|ig/i, // Instagram
    /facebook\.com|fb/i, // Facebook
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
    /http(s)?:\/\/\S+/, // URLs
    /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/, // UPI IDs (basic regex)
  ];

  async validateAndSaveMessage(chatId: string, senderId: string, content: string) {
    if (!content || typeof content !== 'string') {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Invalid message format');
    }

    // Blocked Content Detection (Bypassed for image sharing and structured quote replies)
    const isStructuredContent = content.startsWith('[IMAGE]:') || content.startsWith('[REPLY:');
    if (!isStructuredContent) {
      for (const pattern of this.BLOCKED_PATTERNS) {
        if (pattern.test(content)) {
          throw new ApiError(STATUS_CODES.FORBIDDEN, 'Message contains blocked content', 'BLOCKED_CONTENT');
        }
      }
    }

    // Ensure chat is active
    const chat = await Chat.findById(chatId);
    if (!chat || chat.status !== ChatStatus.ACTIVE) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'Chat is not active', 'CHAT_INACTIVE');
    }

    // Persistence
    const message = await messageRepository.create(chatId, senderId, content);
    return message;
  }
}

export const messageService = new MessageService();
