const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const mkDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

mkDir(path.join(backendDir, 'src/sockets'));
mkDir(path.join(backendDir, 'src/sockets/handlers'));
mkDir(path.join(backendDir, 'src/middlewares'));
mkDir(path.join(backendDir, 'src/services'));
mkDir(path.join(backendDir, 'src/repositories'));

const files = {
  'src/middlewares/socketAuth.middleware.ts': `import { Socket } from 'socket.io';
import { verifyAccessToken, JwtPayload } from '@/utils/jwt.util';
import { userRepository } from '@/repositories/user.repository';
import logger from '@/config/logger.config';

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export const socketAuthMiddleware = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = verifyAccessToken(token);
    const user = await userRepository.findById(decoded.userId);

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return next(new Error('Authentication error: Token invalid or expired'));
    }

    socket.user = decoded;
    next();
  } catch (error) {
    logger.error(\`Socket Auth Error: \${(error as Error).message}\`);
    next(new Error('Authentication error'));
  }
};
`,
  'src/repositories/message.repository.ts': `import { Message } from '@/models';
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
`,
  'src/services/message.service.ts': `import { messageRepository } from '@/repositories/message.repository';
import { chatRepository } from '@/repositories/chat.repository'; // Assume this has a findById method
import { Chat } from '@/models'; // fallback
import { ApiError } from '@/utils/ApiError.util';
import { STATUS_CODES } from '@/constants/statusCodes.constant';
import { ChatStatus } from '@/constants/enums.constant';

class MessageService {
  private readonly BLOCKED_PATTERNS = [
    /\\b\\d{10}\\b/, // Phone Numbers
    /wa\\.me|whatsapp/i, // WhatsApp
    /t\\.me|telegram/i, // Telegram
    /instagram\\.com|ig/i, // Instagram
    /facebook\\.com|fb/i, // Facebook
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/, // Email
    /http(s)?:\\/\\/\\S+/, // URLs
    /[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}/, // UPI IDs (basic regex)
  ];

  async validateAndSaveMessage(chatId: string, senderId: string, content: string) {
    if (!content || typeof content !== 'string') {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Invalid message format');
    }

    // Blocked Content Detection
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(content)) {
        throw new ApiError(STATUS_CODES.FORBIDDEN, 'Message contains blocked content', 'BLOCKED_CONTENT');
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
`,
  'src/services/chatSession.service.ts': `import { Chat } from '@/models';
import { walletRepository } from '@/repositories/wallet.repository';
import { walletTransactionRepository } from '@/repositories/walletTransaction.repository';
import { PlatformSetting } from '@/models';
import { ChatStatus, TransactionType } from '@/constants/enums.constant';
import { Types } from 'mongoose';
import logger from '@/config/logger.config';
import { Server } from 'socket.io';

class ChatSessionService {
  // Map of active chat IDs to their JS interval timers
  private activeTimers = new Map<string, NodeJS.Timeout>();

  public async startChatTimer(chatId: string, io: Server) {
    if (this.activeTimers.has(chatId)) return; // Already running

    logger.info(\`Starting billing timer for chat \${chatId}\`);
    
    // Timer runs every 60 seconds
    const interval = setInterval(async () => {
      try {
        await this.processMinuteDeduction(chatId, io);
      } catch (error) {
        logger.error(\`Timer error for chat \${chatId}: \${(error as Error).message}\`);
        this.stopChatTimer(chatId, io, 'ERROR');
      }
    }, 60000);

    this.activeTimers.set(chatId, interval);
  }

  public async stopChatTimer(chatId: string, io?: Server, reason?: string) {
    const timer = this.activeTimers.get(chatId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(chatId);
      logger.info(\`Stopped timer for chat \${chatId}. Reason: \${reason}\`);
      
      try {
        const chat = await Chat.findById(chatId);
        if (chat && chat.status === ChatStatus.ACTIVE) {
          chat.status = ChatStatus.COMPLETED;
          chat.endTime = new Date();
          await chat.save();
          if (io) {
            io.to(\`chat:\${chatId}\`).emit('chat:ended', { chatId, reason });
          }
        }
      } catch (error) {
        logger.error(\`Error stopping chat \${chatId}: \${(error as Error).message}\`);
      }
    }
  }

  private async processMinuteDeduction(chatId: string, io: Server) {
    const chat = await Chat.findById(chatId);
    if (!chat || chat.status !== ChatStatus.ACTIVE) {
      this.stopChatTimer(chatId, io, 'CHAT_NOT_ACTIVE');
      return;
    }

    const settings = await PlatformSetting.findOne() || { coinsPerMinute: 10, commissionPercentage: 20 };
    const coinsToDeduct = settings.coinsPerMinute;
    
    const boyWallet = await walletRepository.findByUserId(chat.boyId.toString());
    
    if (!boyWallet || boyWallet.currentBalance < coinsToDeduct) {
      io.to(\`chat:\${chatId}\`).emit('chat:error', { message: 'Insufficient coins. Chat ended.' });
      this.stopChatTimer(chatId, io, 'INSUFFICIENT_COINS');
      return;
    }

    // Deduct from Boy
    await walletRepository.incrementBalance(chat.boyId.toString(), -coinsToDeduct, 'lifetimeSpent');
    await walletTransactionRepository.create({
      walletId: boyWallet.id,
      userId: chat.boyId,
      type: TransactionType.CHAT_DEBIT,
      amount: coinsToDeduct,
      description: \`Minute deduction for Chat \${chatId}\`,
      referenceId: chat._id,
    });

    // Calculate Commission and Earnings
    const girlEarnings = coinsToDeduct * (1 - settings.commissionPercentage / 100);
    const girlWallet = await walletRepository.findByUserId(chat.girlId.toString());
    
    if (girlWallet) {
      await walletRepository.incrementBalance(chat.girlId.toString(), girlEarnings, 'lifetimeEarnings');
      await walletTransactionRepository.create({
        walletId: girlWallet.id,
        userId: chat.girlId,
        type: TransactionType.EARNING,
        amount: girlEarnings,
        description: \`Minute earnings for Chat \${chatId}\`,
        referenceId: chat._id,
      });
    }

    // Update Chat Stats
    chat.durationInMinutes += 1;
    chat.totalCost += coinsToDeduct;
    await chat.save();

    // Broadcast balance update
    io.to(\`user:\${chat.boyId}\`).emit('wallet:update', { balance: boyWallet.currentBalance - coinsToDeduct });
  }
}

export const chatSessionService = new ChatSessionService();
`,
  'src/sockets/handlers/chat.handler.ts': `import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@/middlewares/socketAuth.middleware';
import { messageService } from '@/services/message.service';
import { chatSessionService } from '@/services/chatSession.service';
import logger from '@/config/logger.config';
import { Chat } from '@/models';
import { ChatStatus } from '@/constants/enums.constant';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user!.userId;

  socket.on('chat:join', async (payload: { chatId: string }, callback) => {
    try {
      const { chatId } = payload;
      const chat = await Chat.findById(chatId);
      
      if (!chat) {
        if (callback) callback({ error: 'Chat not found' });
        return;
      }

      if (chat.boyId.toString() !== userId && chat.girlId.toString() !== userId) {
        if (callback) callback({ error: 'Unauthorized room access' });
        return;
      }

      socket.join(\`chat:\${chatId}\`);
      logger.info(\`User \${userId} joined chat room \${chatId}\`);

      // Start timer if it's an active chat (idempotent)
      if (chat.status === ChatStatus.ACTIVE) {
        chatSessionService.startChatTimer(chatId, io);
      }

      if (callback) callback({ success: true });
    } catch (error) {
      if (callback) callback({ error: (error as Error).message });
    }
  });

  socket.on('chat:leave', (payload: { chatId: string }) => {
    socket.leave(\`chat:\${payload.chatId}\`);
  });

  socket.on('chat:send_message', async (payload: { chatId: string; content: string; tempId?: string }, callback) => {
    try {
      const { chatId, content, tempId } = payload;
      
      // Validates against regex and persists
      const message = await messageService.validateAndSaveMessage(chatId, userId, content);

      // Broadcast to room (excluding sender)
      socket.to(\`chat:\${chatId}\`).emit('chat:receive_message', {
        _id: message._id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      });

      if (callback) callback({ success: true, message, tempId });
    } catch (error: any) {
      logger.error(\`Message Error: \${error.message}\`);
      if (callback) callback({ error: error.message, tempId: payload.tempId });
    }
  });

  socket.on('chat:typing_start', (payload: { chatId: string }) => {
    socket.to(\`chat:\${payload.chatId}\`).emit('chat:typing_start', { chatId: payload.chatId, userId });
  });

  socket.on('chat:typing_stop', (payload: { chatId: string }) => {
    socket.to(\`chat:\${payload.chatId}\`).emit('chat:typing_stop', { chatId: payload.chatId, userId });
  });

  socket.on('chat:read', (payload: { chatId: string; messageId: string }) => {
    socket.to(\`chat:\${payload.chatId}\`).emit('chat:read_receipt', { chatId: payload.chatId, messageId: payload.messageId, userId });
  });
};
`,
  'src/sockets/handlers/presence.handler.ts': `import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@/middlewares/socketAuth.middleware';
import { User } from '@/models';
import logger from '@/config/logger.config';

export const registerPresenceHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user!.userId;

  // Personal room for direct updates (like wallet)
  socket.join(\`user:\${userId}\`);

  socket.on('presence:online', async () => {
    logger.info(\`User \${userId} is online\`);
    // In a real Redis setup, you'd store this in a hash map for fast global lookup.
    // We emit to all since a user might be favored.
    io.emit('presence:update', { userId, status: 'ONLINE' });
  });

  socket.on('disconnect', async () => {
    logger.info(\`User \${userId} disconnected (Socket \${socket.id})\`);
    
    // Broadcast offline status immediately
    io.emit('presence:update', { userId, status: 'OFFLINE', lastSeen: new Date() });
    
    // Note: If they reconnect within the pingTimeout, Socket.IO handles it implicitly.
    // If we wanted to pause billing on disconnect, we would hook into chatSessionService here,
    // but typically billing continues until the chat is explicitly ended by a user or zero balance.
  });
};
`,
  'src/sockets/index.ts': `import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import envConfig from '@/config/env.config';
import logger from '@/config/logger.config';
import { socketAuthMiddleware, AuthenticatedSocket } from '@/middlewares/socketAuth.middleware';
import { registerChatHandlers } from './handlers/chat.handler';
import { registerPresenceHandlers } from './handlers/presence.handler';

let io: SocketIOServer;

export const initializeSocket = (server: HttpServer): void => {
  io = new SocketIOServer(server, {
    cors: {
      origin: envConfig.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  // Attach Authentication Middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(\`Authenticated Socket Connected: \${socket.id} for User: \${socket.user?.userId}\`);

    // Register Handlers
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);

    // Initial join room is handled in presence handler (user:<id>)
  });
};
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, relativePath);
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Socket Engine scaffolding complete.');
