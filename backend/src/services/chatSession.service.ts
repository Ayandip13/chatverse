import { Chat, Wallet, PlatformSetting } from '@/models';
import { ChatStatus } from '@/constants/enums.constant';
import { settlementService } from './settlement.service';
import logger from '@/config/logger.config';
import { Server } from 'socket.io';
import { Types } from 'mongoose';

interface SessionState {
  chatId: string;
  boyId: string;
  girlId: string;
  boyJoined: boolean;
  girlJoined: boolean;
  startedAt: Date | null;
  completedMinutes: number;
  boyDisconnectedAt: Date | null;
  girlDisconnectedAt: Date | null;
  graceTimeout: NodeJS.Timeout | null;
  tickInterval: NodeJS.Timeout | null;
}

class ChatSessionService {
  private sessions = new Map<string, SessionState>();

  /**
   * Called when a participant joins the chat socket room
   */
  public async onParticipantJoined(chatId: string, userId: string, io: Server) {
    let session = this.sessions.get(chatId);

    if (!session) {
      const chat = await Chat.findById(chatId);
      if (!chat || chat.status !== ChatStatus.ACTIVE) return;

      session = {
        chatId,
        boyId: chat.boyId.toString(),
        girlId: chat.girlId.toString(),
        boyJoined: false,
        girlJoined: false,
        startedAt: chat.startTime || null,
        completedMinutes: chat.durationInMinutes || 0,
        boyDisconnectedAt: null,
        girlDisconnectedAt: null,
        graceTimeout: null,
        tickInterval: null,
      };
      this.sessions.set(chatId, session);
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

    // If a disconnect grace timer was running, clear it since user reconnected
    if (session.graceTimeout) {
      clearTimeout(session.graceTimeout);
      session.graceTimeout = null;
      logger.info(`Cleared disconnect grace period for chat ${chatId}`);
      io.to(`chat:${chatId}`).emit('chat:participant_reconnected', { chatId, userId });
    }

    // Both users must enter the room before timer starts
    if (session.boyJoined && session.girlJoined && !session.tickInterval) {
      if (!session.startedAt) {
        session.startedAt = new Date();
        await Chat.findByIdAndUpdate(chatId, { startTime: session.startedAt });
      }
      this.startTickInterval(session, io);
      logger.info(`Both participants present. Started billing timer for chat ${chatId}`);
      io.to(`chat:${chatId}`).emit('chat:timer_started', { chatId, startedAt: session.startedAt });
    }
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

    io.to(`chat:${chatId}`).emit('chat:participant_disconnected', { chatId, userId, graceSeconds: 30 });

    // Start 30 second grace period timer
    if (!session.graceTimeout) {
      session.graceTimeout = setTimeout(() => {
        logger.info(`Grace period expired for chat ${chatId}. Terminating session.`);
        this.stopChatSession(chatId, io, 'DISCONNECTED');
      }, 30000); // 30 seconds
    }
  }

  /**
   * Internal tick interval processor (runs every 5 seconds to accurately evaluate minute boundaries)
   */
  private startTickInterval(session: SessionState, io: Server) {
    if (session.tickInterval) return;

    session.tickInterval = setInterval(async () => {
      try {
        await this.processTick(session.chatId, io);
      } catch (error) {
        logger.error(`Error processing tick for chat ${session.chatId}: ${(error as Error).message}`);
      }
    }, 5000); // Poll every 5 seconds for smooth timer ticks
  }

  /**
   * Evaluates elapsed duration and processes completed minute billing
   */
  private async processTick(chatId: string, io: Server) {
    const session = this.sessions.get(chatId);
    if (!session || !session.startedAt) return;

    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);
    const targetCompletedMinutes = Math.floor(elapsedSeconds / 60);

    const boyWallet = await Wallet.findOne({ userId: new Types.ObjectId(session.boyId) });
    const remainingCoins = boyWallet ? boyWallet.currentBalance : 0;
    const estimatedMinutesLeft = Math.floor(remainingCoins / 10);

    // If new minute completed, trigger atomic settlement
    if (targetCompletedMinutes > session.completedMinutes) {
      const minutesToSettle = targetCompletedMinutes - session.completedMinutes;

      for (let i = 0; i < minutesToSettle; i++) {
        const result = await settlementService.processMinuteSettlement(
          session.chatId,
          session.boyId,
          session.girlId
        );

        if (!result.success) {
          logger.warn(`Settlement failed for chat ${chatId}: ${result.error}. Terminating chat.`);
          io.to(`chat:${chatId}`).emit('chat:error', { message: 'Insufficient wallet balance to continue chat.' });
          await this.stopChatSession(chatId, io, 'INSUFFICIENT_FUNDS');
          return;
        }

        session.completedMinutes += 1;
      }

      // Update Chat model with total duration & cost
      await Chat.findByIdAndUpdate(chatId, {
        durationInMinutes: session.completedMinutes,
        totalCost: session.completedMinutes * 10,
      });

      // Fetch fresh balances for emission
      const updatedBoyWallet = await Wallet.findOne({ userId: new Types.ObjectId(session.boyId) });
      const updatedGirlWallet = await Wallet.findOne({ userId: new Types.ObjectId(session.girlId) });

      if (updatedBoyWallet) {
        io.to(`user:${session.boyId}`).emit('wallet:update', {
          newBalance: updatedBoyWallet.currentBalance,
          delta: -10,
          reason: 'CHAT_DEBIT',
        });
      }
      if (updatedGirlWallet) {
        io.to(`user:${session.girlId}`).emit('wallet:update', {
          newBalance: updatedGirlWallet.currentBalance,
          delta: 8,
          reason: 'GIRL_EARNING',
        });
      }
    }

    // Emit live tick to active chat room
    io.to(`chat:${chatId}`).emit('chat:tick', {
      chatId,
      elapsedSeconds,
      completedMinutes: session.completedMinutes,
      remainingCoins,
      estimatedMinutesLeft,
    });

    // Low balance alert trigger (< 20 coins = < 2 minutes left)
    if (remainingCoins < 20 && remainingCoins >= 10) {
      io.to(`user:${session.boyId}`).emit('wallet:low_balance', {
        currentBalance: remainingCoins,
        estimatedMinutesLeft,
        message: 'Your coin balance is running low! Please recharge to continue chatting.',
      });
    }
  }

  /**
   * Terminate chat session gracefully
   */
  public async stopChatSession(chatId: string, io?: Server, reason: string = 'MANUAL') {
    const session = this.sessions.get(chatId);

    if (session) {
      if (session.tickInterval) clearInterval(session.tickInterval);
      if (session.graceTimeout) clearTimeout(session.graceTimeout);
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
        const session: SessionState = {
          chatId,
          boyId: chat.boyId.toString(),
          girlId: chat.girlId.toString(),
          boyJoined: false, // Will re-verify on room join
          girlJoined: false,
          startedAt: chat.startTime || new Date(),
          completedMinutes: chat.durationInMinutes || 0,
          boyDisconnectedAt: null,
          girlDisconnectedAt: null,
          graceTimeout: null,
          tickInterval: null,
        };
        this.sessions.set(chatId, session);
      }
    } catch (error) {
      logger.error(`Failed to recover active chat sessions: ${(error as Error).message}`);
    }
  }
}

export const chatSessionService = new ChatSessionService();
