import { Chat } from '@/models';
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

    logger.info(`Starting billing timer for chat ${chatId}`);
    
    // Timer runs every 60 seconds
    const interval = setInterval(async () => {
      try {
        await this.processMinuteDeduction(chatId, io);
      } catch (error) {
        logger.error(`Timer error for chat ${chatId}: ${(error as Error).message}`);
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
      logger.info(`Stopped timer for chat ${chatId}. Reason: ${reason}`);
      
      try {
        const chat = await Chat.findById(chatId);
        if (chat && chat.status === ChatStatus.ACTIVE) {
          chat.status = ChatStatus.ENDED;
          chat.endTime = new Date();
          await chat.save();
          if (io) {
            io.to(`chat:${chatId}`).emit('chat:ended', { chatId, reason });
          }
        }
      } catch (error) {
        logger.error(`Error stopping chat ${chatId}: ${(error as Error).message}`);
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
      io.to(`chat:${chatId}`).emit('chat:error', { message: 'Insufficient coins. Chat ended.' });
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
      description: `Minute deduction for Chat ${chatId}`,
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
        type: TransactionType.GIRL_EARNING,
        amount: girlEarnings,
        description: `Minute earnings for Chat ${chatId}`,
        referenceId: chat._id,
      });
    }

    // Update Chat Stats
    chat.durationInMinutes += 1;
    chat.totalCost += coinsToDeduct;
    await chat.save();

    // Broadcast balance update
    io.to(`user:${chat.boyId}`).emit('wallet:update', { balance: boyWallet.currentBalance - coinsToDeduct });
  }
}

export const chatSessionService = new ChatSessionService();
