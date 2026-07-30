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

    // Users joined or reconnected
    if (isBoy || isGirl) {
      io.to(`chat:${chatId}`).emit('chat:participant_reconnected', { chatId, userId });
    }

    // Both users must enter the room
    if (session.boyJoined && session.girlJoined) {
      if (!session.startedAt) {
        session.startedAt = new Date();
        await Chat.findByIdAndUpdate(chatId, { startTime: session.startedAt });
      }
      logger.info(`Both participants present for chat ${chatId}`);
      io.to(`chat:${chatId}`).emit('chat:started', { chatId, startedAt: session.startedAt });
    }
  }

  /**
   * Evaluates wallet balance and handles billing per message
   */
  public async processMessageDeduction(chatId: string, senderId: string, io: Server): Promise<boolean> {
    const session = this.sessions.get(chatId);
    if (!session) return false;

    // Only boys pay for messages in this model
    if (senderId !== session.boyId) {
      return true; // Girl sends for free
    }

    const boyWallet = await Wallet.findOne({ userId: new Types.ObjectId(session.boyId) });
    if (!boyWallet || boyWallet.currentBalance < 1) {
      io.to(`chat:${chatId}`).emit('chat:error', { message: 'Insufficient wallet balance to send a message.' });
      return false; // Cannot send
    }

    const result = await settlementService.processMessageSettlement(
      session.chatId,
      session.boyId,
      session.girlId
    );

    if (!result.success) {
      io.to(`chat:${chatId}`).emit('chat:error', { message: 'Failed to process payment for message.' });
      return false;
    }

    // Update Chat model with total duration & cost (message count)
    const updatedChat = await Chat.findByIdAndUpdate(chatId, {
      $inc: { durationInMinutes: 1, totalCost: 1 } // Using durationInMinutes temporarily as message count until model is updated
    }, { new: true });

    // Fetch fresh balances for emission
    const updatedBoyWallet = await Wallet.findOne({ userId: new Types.ObjectId(session.boyId) });
    const updatedGirlWallet = await Wallet.findOne({ userId: new Types.ObjectId(session.girlId) });

    if (updatedBoyWallet) {
      io.to(`user:${session.boyId}`).emit('wallet:update', {
        newBalance: updatedBoyWallet.currentBalance,
        delta: -1,
        reason: 'CHAT_DEBIT',
      });
      // Emit tick-like event to update stats on frontend
      io.to(`chat:${chatId}`).emit('chat:stats_update', {
        chatId,
        messagesSent: updatedChat ? updatedChat.totalCost : 1, // Use the current chat's cost
        remainingCoins: updatedBoyWallet.currentBalance
      });
    }
    
    if (updatedGirlWallet) {
      io.to(`user:${session.girlId}`).emit('wallet:update', {
        newBalance: updatedGirlWallet.currentBalance,
        delta: 1,
        reason: 'GIRL_EARNING',
      });
    }

    return true;
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
    
    // Note: We no longer auto-terminate the session on disconnect. 
    // It remains active until explicitly ended by the girl.
  }



  /**
   * Terminate chat session gracefully
   */
  public async stopChatSession(chatId: string, io?: Server, reason: string = 'MANUAL') {
    const session = this.sessions.get(chatId);

    if (session) {
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
        };
        this.sessions.set(chatId, session);
      }
    } catch (error) {
      logger.error(`Failed to recover active chat sessions: ${(error as Error).message}`);
    }
  }
}

export const chatSessionService = new ChatSessionService();
