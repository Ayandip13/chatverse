import { useEffect, useState } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Message } from '../api/messagingApi';
import { Alert } from 'react-native';

export interface ChatStatsData {
  chatId: string;
  messagesSent: number;
  remainingCoins: number;
}

export interface ChatEndedSummary {
  chatId: string;
  reason: string;
  finalDuration: number;
  finalCost: number;
}

export interface DisconnectState {
  userId: string;
  chatId: string;
  graceSeconds: number;
}

export const useChatSocket = (chatId?: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?._id);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [chatStats, setChatStats] = useState<ChatStatsData | null>(null);
  const [endedSummary, setEndedSummary] = useState<ChatEndedSummary | null>(null);
  const [disconnectState, setDisconnectState] = useState<DisconnectState | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    if (chatId) {
      socket.emit('chat:join', { chatId });
      socket.emit('chat:read', { chatId });
    }

    const onMessage = (message: Message) => {
      queryClient.setQueryData(['messages', message.chatId], (oldData: any) => {
        if (!oldData) return oldData;

        // Dedupe: if this message already exists in the cache
        const exists = oldData.pages.some((page: any) =>
          (page.messages || []).some((m: any) => m?._id === message._id)
        );
        if (exists) return oldData;

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

      // If user is actively inside this chat room screen, mark as read after a 1.5s view delay
      if (chatId && message.chatId === chatId && message.senderId && message.senderId !== userId) {
        setTimeout(() => {
          socket.emit('chat:read', { chatId, messageId: message._id });
        }, 1500);
      }
    };

    const onStatusUpdate = (data: { chatId: string; messageId?: string; status: 'SENT' | 'DELIVERED' | 'READ'; readBy?: string }) => {
      // If status read event was triggered by current user, don't alter own tick UI
      if (data.readBy && data.readBy === userId) return;

      queryClient.setQueryData(['messages', data.chatId], (oldData: any) => {
        if (!oldData) return oldData;
        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          messages: (page.messages || []).map((m: any) => {
            // Update status only for messages sent by current user
            if (m.senderId === userId || !m.senderId || m._id?.startsWith('temp-')) {
              const matchesTarget = !data.messageId || m._id === data.messageId;
              if (matchesTarget) {
                return { ...m, status: data.status };
              }
            }
            return m;
          }),
        }));
        return { ...oldData, pages: newPages };
      });
    };

    const onTypingStart = ({ chatId: typedChatId }: any) => {
      if (typedChatId === chatId) setIsOtherUserTyping(true);
    };

    const onTypingStop = ({ chatId: typedChatId }: any) => {
      if (typedChatId === chatId) setIsOtherUserTyping(false);
    };

    const onStatsUpdate = (data: ChatStatsData) => {
      if (!chatId || data.chatId === chatId) {
        setChatStats(data);
      }
    };

    const onChatEnded = (data: ChatEndedSummary) => {
      if (!chatId || data.chatId === chatId) {
        if (graceTimer) clearInterval(graceTimer);
        setDisconnectState(null);
        setEndedSummary(data);
        queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.invalidateQueries({ queryKey: ['withdrawalSummary'] });
      }
    };

    const onParticipantDisconnected = (data: { chatId: string; userId: string; graceSeconds?: number }) => {
      if (!chatId || data.chatId === chatId) {
        const initialSecs = data.graceSeconds !== undefined ? data.graceSeconds : 30;
        setDisconnectState({ userId: data.userId, chatId: data.chatId, graceSeconds: initialSecs });

        if (graceTimer) clearInterval(graceTimer);
        graceTimer = setInterval(() => {
          setDisconnectState((prev) => {
            if (!prev) return null;
            if (prev.graceSeconds <= 1) {
              if (graceTimer) clearInterval(graceTimer);
              return null;
            }
            return { ...prev, graceSeconds: prev.graceSeconds - 1 };
          });
        }, 1000);
      }
    };

    const onParticipantReconnected = (data: { chatId: string; userId: string }) => {
      if (!chatId || data.chatId === chatId) {
        if (graceTimer) clearInterval(graceTimer);
        setDisconnectState(null);
      }
    };

    const onWalletUpdate = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalSummary'] });
      queryClient.invalidateQueries({ queryKey: ['myWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['walletSummary'] });

      const newBal = payload?.newBalance !== undefined ? payload.newBalance : payload?.balance;
      if (newBal !== undefined) {
        queryClient.setQueryData(['withdrawalSummary'], (old: any) =>
          old ? { ...old, walletBalance: newBal, totalCoins: newBal } : old
        );
      }
    };

    socket.on('chat:receive_message', onMessage);
    socket.on('chat:message_status_update', onStatusUpdate);
    socket.on('chat:typing_start', onTypingStart);
    socket.on('chat:typing_stop', onTypingStop);
    socket.on('chat:stats_update', onStatsUpdate);
    socket.on('chat:ended', onChatEnded);
    socket.on('chat:participant_disconnected', onParticipantDisconnected);
    socket.on('chat:participant_reconnected', onParticipantReconnected);
    socket.on('wallet:update', onWalletUpdate);

    return () => {
      if (graceTimer) clearInterval(graceTimer);
      if (chatId) socket.emit('chat:leave', { chatId });
      socket.off('chat:receive_message', onMessage);
      socket.off('chat:message_status_update', onStatusUpdate);
      socket.off('chat:typing_start', onTypingStart);
      socket.off('chat:typing_stop', onTypingStop);
      socket.off('chat:stats_update', onStatsUpdate);
      socket.off('chat:ended', onChatEnded);
      socket.off('chat:participant_disconnected', onParticipantDisconnected);
      socket.off('chat:participant_reconnected', onParticipantReconnected);
      socket.off('wallet:update', onWalletUpdate);
    };
  }, [socket, isConnected, chatId, queryClient]);

  const sendMessage = (chatId: string, content: string, tempId: string) => {
    if (!socket || !isConnected) return;

    // Optimistically insert a temporary (SENDING) message so the sender sees it
    // immediately, before the server round-trip completes.
    const tempMessage: Message & { status: 'SENDING' } = {
      _id: tempId,
      chatId,
      senderId: userId || '',
      content,
      createdAt: new Date().toISOString(),
      status: 'SENDING',
    };

    queryClient.setQueryData(['messages', chatId], (oldData: any) => {
      if (!oldData) return oldData;
      const newPages = [...oldData.pages];
      if (newPages.length > 0) {
        newPages[0] = {
          ...newPages[0],
          messages: [tempMessage, ...newPages[0].messages],
        };
      }
      return { ...oldData, pages: newPages };
    });

    socket.emit('chat:send_message', { chatId, content, tempId }, (response: any) => {
      if (response && response.error) {
        // Failed — remove the optimistic temp message.
        queryClient.setQueryData(['messages', chatId], (oldData: any) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page: any) => ({
            ...page,
            messages: (page.messages || []).filter((m: any) => m?._id !== tempId),
          }));
          return { ...oldData, pages: newPages };
        });
        Alert.alert('Error', response.error);
        return;
      }

      // Success — replace the temp message with the real saved message (if it
      // isn't already present via the broadcast).
      if (response?.message) {
        const saved = response.message;
        queryClient.setQueryData(['messages', chatId], (oldData: any) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page: any) => {
            const messages = page.messages || [];
            const exists = messages.some((m: any) => m?._id === saved._id);
            if (exists) return page;
            return {
              ...page,
              messages: messages.map((m: any) => (m?._id === tempId ? saved : m)),
            };
          });
          return { ...oldData, pages: newPages };
        });
      }
    });
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

  return { sendMessage, emitTyping, endChatSession, isOtherUserTyping, chatStats, endedSummary, disconnectState };
};
