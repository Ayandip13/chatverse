import { Chat, Wallet } from '@/models';
import { ChatStatus } from '@/constants/enums.constant';
import { settlementService } from './settlement.service';
import logger from '@/config/logger.config';
import { Server } from 'socket.io';
import { Types } from 'mongoose';

export const BILLING_CYCLE_SECONDS = 60; // 1 completed minute = 60 seconds
export const COINS_PER_CYCLE = 1;

interface SessionState {
  chatId: string;
  boyId: string;
  girlId: string;
  boyJoined: boolean;
  girlJoined: boolean;
  startedAt: Date | null;
  elapsedSeconds: number;
  timerHandle?: NodeJS.Timeout;
  boyDisconnectedAt: Date | null;
  girlDisconnectedAt: Date | null;
  lastDeductionAt?: number;
}

class ChatSessionService {
  private sessions = new Map<string, SessionState>();

  /**
   * Immediately starts a continuous background session timer for an active chat
   */
  public async startSession(
    chatId: string,
    boyId: string,
    girlId: string,
    io: Server,
    existingStartTime?: Date
  ) {
    let session = this.sessions.get(chatId);
    const startedAt = existingStartTime || new Date();
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);

    if (!session) {
      session = {
        chatId,
        boyId,
        girlId,
        boyJoined: true,
        girlJoined: true,
        startedAt,
        elapsedSeconds: Math.max(0, elapsed),
        boyDisconnectedAt: null,
        girlDisconnectedAt: null,
      };
      this.sessions.set(chatId, session);
    } else {
      session.startedAt = startedAt;
      session.elapsedSeconds = Math.max(0, elapsed);
    }

    await Chat.findByIdAndUpdate(chatId, { startTime: startedAt });
    this.startSessionTimer(session, io);

    io.to(`chat:${chatId}`).emit('chat:started', { 
      chatId, 
      startedAt,
      elapsedSeconds: session.elapsedSeconds,
    });
  }

  /**
   * Called when a participant joins the chat socket room
   */
  public async onParticipantJoined(chatId: string, userId: string, io: Server) {
    let session = this.sessions.get(chatId);

    if (!session) {
      const chat = await Chat.findById(chatId);
      if (!chat || chat.status !== ChatStatus.ACTIVE) return;

      const startedAt = chat.startTime || new Date();
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);

      session = {
        chatId,
        boyId: chat.boyId.toString(),
        girlId: chat.girlId.toString(),
        boyJoined: false,
        girlJoined: false,
        startedAt,
        elapsedSeconds: Math.max(0, elapsed),
        boyDisconnectedAt: null,
        girlDisconnectedAt: null,
      };
      this.sessions.set(chatId, session);
      this.startSessionTimer(session, io);
    }

    const isBoy = userId === session.boyId;
    const isGirl = userId === session.girlId;

    if (isBoy) {
      session.boyJoined = true;
      session.boyDisconnectedAt = null;
    }
    if (isGirl) {
      session.girlJoined = true;
      session.girlDisconnectedAt = null;
    }

    // Notify room of participant presence
    if (isBoy || isGirl) {
      io.to(`chat:${chatId}`).emit('chat:participant_reconnected', { chatId, userId });
    }

    // Always ensure timer is ticking and broadcast current state
    this.startSessionTimer(session, io);
    io.to(`chat:${chatId}`).emit('chat:timer_tick', {
      chatId,
      elapsedSeconds: session.elapsedSeconds,
    });
  }

  /**
   * Starts a 1-second ticker for this session to track elapsed seconds and deduct 1 coin every 60 seconds (1 minute).
   * Runs continuously until all available coins reach 0.
   */
  private startSessionTimer(session: SessionState, io: Server) {
    if (session.timerHandle) return;

    session.timerHandle = setInterval(async () => {
      if (session.startedAt) {
        session.elapsedSeconds = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      } else {
        session.elapsedSeconds += 1;
      }

      // Broadcast timer tick to keep clients in sync
      io.to(`chat:${session.chatId}`).emit('chat:timer_tick', {
        chatId: session.chatId,
        elapsedSeconds: session.elapsedSeconds,
      });

      // Deduct 1 coin every 60 seconds (1 completed minute)
      if (session.elapsedSeconds > 0 && session.elapsedSeconds % BILLING_CYCLE_SECONDS === 0) {
        logger.info(`Chat ${session.chatId} reached ${session.elapsedSeconds}s (1 minute cycle). Deducting 1 coin...`);
        await this.processTimeIntervalDeduction(session.chatId, io);
      }
    }, 1000);
  }

  /**
   * Evaluates wallet balance and handles 1-coin deduction per 40-second chat cycle.
   */
  public async processTimeIntervalDeduction(chatId: string, io: Server): Promise<boolean> {
    const session = this.sessions.get(chatId);
    if (!session) return false;

    const result = await settlementService.processSessionSettlement(
      session.chatId,
      session.boyId,
      session.girlId,
      COINS_PER_CYCLE
    );

    if (!result.success) {
      logger.warn(`Insufficient balance for Boy ${session.boyId} in Chat ${chatId}. Terminating session.`);
      io.to(`chat:${chatId}`).emit('chat:low_balance', {
        chatId,
        message: 'Insufficient coins. Chat session ended.',
      });
      await this.stopChatSession(chatId, io, 'INSUFFICIENT_FUNDS');
      return false;
    }

    // Update Chat model with duration and total cost
    const updatedChat = await Chat.findByIdAndUpdate(chatId, {
      $inc: { durationInMinutes: 1, totalCost: COINS_PER_CYCLE }
    }, { new: true });

    const boyBalance = result.boyBalance;
    const girlBalance = result.girlBalance;

    if (boyBalance !== undefined) {
      io.to(`user:${session.boyId}`).emit('wallet:update', {
        newBalance: boyBalance,
        delta: -COINS_PER_CYCLE,
        reason: 'CHAT_DEBIT',
      });

      if (boyBalance <= 2 && boyBalance > 0) {
        io.to(`chat:${chatId}`).emit('chat:low_balance_warning', {
          chatId,
          warning: `Low coin balance (${boyBalance} left). Recharge to continue chatting.`,
        });
      } else if (boyBalance === 0) {
        logger.info(`Boy ${session.boyId} reached 0 coins in Chat ${chatId}. Ending chat session...`);
        io.to(`chat:${chatId}`).emit('chat:low_balance', {
          chatId,
          message: 'Your coins have reached 0. Chat session ended.',
        });
        await this.stopChatSession(chatId, io, 'INSUFFICIENT_FUNDS');
        return false;
      }
    }

    if (girlBalance !== undefined) {
      io.to(`user:${session.girlId}`).emit('wallet:update', {
        newBalance: girlBalance,
        delta: COINS_PER_CYCLE,
        reason: 'GIRL_EARNING',
      });
    }

    io.to(`chat:${chatId}`).emit('chat:stats_update', {
      chatId,
      elapsedSeconds: session.elapsedSeconds,
      totalCost: updatedChat ? updatedChat.totalCost : 1,
      remainingCoins: boyBalance,
    });

    return true;
  }

  /**
   * Helper to ensure session timer starts when first message is sent if not already started
   */
  public async ensureSessionStarted(chatId: string, io?: Server) {
    const session = this.sessions.get(chatId);
    if (session && !session.startedAt) {
      session.startedAt = new Date();
      session.elapsedSeconds = 0;
      await Chat.findByIdAndUpdate(chatId, { startTime: session.startedAt });
      if (io) {
        io.to(`chat:${chatId}`).emit('chat:started', { 
          chatId, 
          startedAt: session.startedAt,
          elapsedSeconds: 0,
        });
        this.startSessionTimer(session, io);
      }
    }
  }

  /**
   * Pre-check to determine if the sender is allowed to send a message.
   * Girls always send free. Boys must have at least 1 coin in their wallet.
   */
  public async canSendMessage(chatId: string, senderId: string): Promise<{ allowed: boolean; error?: string }> {
    let session = this.sessions.get(chatId);

    // If session is not currently in memory, retrieve from database
    if (!session) {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return { allowed: false, error: 'Chat not found' };
      }

      if (chat.status !== ChatStatus.ACTIVE) {
        return { allowed: false, error: 'This chat session has ended or is inactive' };
      }

      const elapsed = chat.startTime 
        ? Math.floor((Date.now() - new Date(chat.startTime).getTime()) / 1000)
        : 0;

      session = {
        chatId,
        boyId: chat.boyId.toString(),
        girlId: chat.girlId.toString(),
        boyJoined: senderId === chat.boyId.toString(),
        girlJoined: senderId === chat.girlId.toString(),
        startedAt: chat.startTime || null,
        elapsedSeconds: Math.max(0, elapsed),
        boyDisconnectedAt: null,
        girlDisconnectedAt: null,
      };
      this.sessions.set(chatId, session);
    }

    if (senderId !== session.boyId) {
      return { allowed: true }; // Girl sends for free
    }

    const boyWallet = await Wallet.findOne({
      $or: [
        { userId: new Types.ObjectId(session.boyId) },
        { userId: session.boyId }
      ]
    }).lean();

    if (!boyWallet || boyWallet.currentBalance < 1) {
      return { 
        allowed: false, 
        error: `Insufficient coins in wallet (Balance: ${boyWallet?.currentBalance ?? 0} coins). Please recharge to send messages.` 
      };
    }

    return { allowed: true };
  }

  /**
   * Process completed 2-minute chat session settlement (backward compatibility)
   */
  public async processTwoMinuteDeduction(chatId: string, io: Server): Promise<boolean> {
    return this.processTimeIntervalDeduction(chatId, io);
  }

  /**
   * Called when a participant disconnects or leaves the room
   */
  public onParticipantLeft(chatId: string, userId: string, io: Server) {
    const session = this.sessions.get(chatId);
    if (!session) return;

    const isBoy = userId === session.boyId;
    const isGirl = userId === session.girlId;

    if (isBoy) {
      session.boyJoined = false;
      session.boyDisconnectedAt = new Date();
    }
    if (isGirl) {
      session.girlJoined = false;
      session.girlDisconnectedAt = new Date();
    }

    io.to(`chat:${chatId}`).emit('chat:participant_disconnected', { chatId, userId });
    
    // Note: Active chat sessions continue continuous background billing on the server
    // even if users browse outside the chat inbox until explicitly ended or coins reach 0.
  }

  /**
   * Terminate chat session gracefully
   */
  public async stopChatSession(chatId: string, io?: Server, reason: string = 'MANUAL') {
    const session = this.sessions.get(chatId);

    if (session) {
      if (session.timerHandle) {
        clearInterval(session.timerHandle);
        session.timerHandle = undefined;
      }
      this.sessions.delete(chatId);
    }

    try {
      const chat = await Chat.findById(chatId);
      if (chat && chat.status === ChatStatus.ACTIVE) {
        chat.status = ChatStatus.ENDED;
        chat.endTime = new Date();
        await chat.save();

        logger.info(`Terminated chat ${chatId}. Reason: ${reason}, Total Duration: ${chat.durationInMinutes}m, Total Cost: ${chat.totalCost} coins`);

        if (io) {
          io.to(`chat:${chatId}`).emit('chat:ended', {
            chatId,
            reason,
            finalDuration: chat.durationInMinutes,
            finalCost: chat.totalCost,
          });
        }
      }
    } catch (error) {
      logger.error(`Error stopping chat ${chatId}: ${(error as Error).message}`);
    }
  }

  /**
   * On server startup, recover active chat sessions from DB
   */
  public async recoverActiveSessions(io: Server) {
    try {
      const activeChats = await Chat.find({ status: ChatStatus.ACTIVE });
      logger.info(`Recovering ${activeChats.length} active chat sessions on server boot...`);

      for (const chat of activeChats) {
        const chatId = chat._id.toString();
        const elapsed = chat.startTime 
          ? Math.floor((Date.now() - new Date(chat.startTime).getTime()) / 1000)
          : 0;

        const session: SessionState = {
          chatId,
          boyId: chat.boyId.toString(),
          girlId: chat.girlId.toString(),
          boyJoined: false,
          girlJoined: false,
          startedAt: chat.startTime || null,
          elapsedSeconds: Math.max(0, elapsed),
          boyDisconnectedAt: null,
          girlDisconnectedAt: null,
        };
        this.sessions.set(chatId, session);
        if (session.startedAt) {
          this.startSessionTimer(session, io);
        }
      }
    } catch (error) {
      logger.error(`Failed to recover active chat sessions: ${(error as Error).message}`);
    }
  }
}

export const chatSessionService = new ChatSessionService();
