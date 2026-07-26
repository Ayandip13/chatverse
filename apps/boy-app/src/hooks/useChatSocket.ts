import { useEffect, useState } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '../store/chatStore';
import { Message } from '../api/messagingApi';
import { Alert } from 'react-native';

export interface ChatTickData {
  chatId: string;
  elapsedSeconds: number;
  completedMinutes: number;
  remainingCoins: number;
  estimatedMinutesLeft: number;
}

export interface ChatEndedSummary {
  chatId: string;
  reason: string;
  finalDuration: number;
  finalCost: number;
}

export const useChatSocket = (chatId?: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const setTyping = useChatStore((state) => state.setTyping);

  const [chatTick, setChatTick] = useState<ChatTickData | null>(null);
  const [lowBalanceWarning, setLowBalanceWarning] = useState<string | null>(null);
  const [endedSummary, setEndedSummary] = useState<ChatEndedSummary | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    if (chatId) {
      socket.emit('chat:join', { chatId });
    }

    const onMessage = (message: Message) => {
      queryClient.setQueryData(['messages', message.chatId], (oldData: any) => {
        if (!oldData) return oldData;
        const newPages = [...oldData.pages];
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            messages: [message, ...newPages[0].messages],
          };
        }
        return { ...oldData, pages: newPages };
      });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    };

    const onTypingStart = ({ chatId: typedChatId }: any) => setTyping(typedChatId, true);
    const onTypingStop = ({ chatId: typedChatId }: any) => setTyping(typedChatId, false);

    const onTick = (data: ChatTickData) => {
      if (!chatId || data.chatId === chatId) {
        setChatTick(data);
        queryClient.setQueryData(['walletSummary'], (old: any) =>
          old ? { ...old, currentBalance: data.remainingCoins } : { currentBalance: data.remainingCoins }
        );
      }
    };

    const onLowBalance = (data: any) => {
      setLowBalanceWarning(data.message || 'Your coin balance is running low!');
    };

    const onChatEnded = (data: ChatEndedSummary) => {
      if (!chatId || data.chatId === chatId) {
        setEndedSummary(data);
        queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }
    };

    const onWalletUpdate = ({ newBalance, balance }: any) => {
      const updatedBalance = newBalance !== undefined ? newBalance : balance;
      queryClient.setQueryData(['walletSummary'], (old: any) =>
        old ? { ...old, currentBalance: updatedBalance } : { currentBalance: updatedBalance }
      );
    };

    socket.on('chat:receive_message', onMessage);
    socket.on('chat:typing_start', onTypingStart);
    socket.on('chat:typing_stop', onTypingStop);
    socket.on('chat:tick', onTick);
    socket.on('wallet:low_balance', onLowBalance);
    socket.on('chat:ended', onChatEnded);
    socket.on('wallet:update', onWalletUpdate);
    socket.on('chat:error', (data) => Alert.alert('Notice', data.message));

    return () => {
      if (chatId) socket.emit('chat:leave', { chatId });
      socket.off('chat:receive_message', onMessage);
      socket.off('chat:typing_start', onTypingStart);
      socket.off('chat:typing_stop', onTypingStop);
      socket.off('chat:tick', onTick);
      socket.off('wallet:low_balance', onLowBalance);
      socket.off('chat:ended', onChatEnded);
      socket.off('wallet:update', onWalletUpdate);
      socket.off('chat:error');
    };
  }, [socket, isConnected, chatId, queryClient, setTyping]);

  const sendMessage = (chatId: string, content: string, tempId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:send_message', { chatId, content, tempId }, (response: any) => {
        if (response?.error) {
          Alert.alert('Error', response.error);
        }
      });
    }
  };

  const emitTyping = (chatId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit(isTyping ? 'chat:typing_start' : 'chat:typing_stop', { chatId });
    }
  };

  const endChatSession = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:end_session', { chatId });
    }
  };

  return { sendMessage, emitTyping, endChatSession, chatTick, lowBalanceWarning, endedSummary };
};
