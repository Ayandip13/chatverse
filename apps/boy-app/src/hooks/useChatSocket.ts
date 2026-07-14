import { useEffect } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '../store/chatStore';
import { Message } from '../api/messagingApi';
import { Alert } from 'react-native';

export const useChatSocket = (chatId?: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const setTyping = useChatStore(state => state.setTyping);
  const activeChatId = useChatStore(state => state.activeChatId);

  useEffect(() => {
    if (!socket || !isConnected) return;

    if (chatId) {
      socket.emit('chat:join', { chatId });
    }

    const onMessage = (message: Message) => {
      // Optimistically update the message cache
      queryClient.setQueryData(['messages', message.chatId], (oldData: any) => {
        if (!oldData) return oldData;
        const newPages = [...oldData.pages];
        if (newPages.length > 0) {
          // Assuming messages are ordered latest first
          newPages[0] = {
            ...newPages[0],
            messages: [message, ...newPages[0].messages]
          };
        }
        return { ...oldData, pages: newPages };
      });
      // Invalidate chats list to update last message
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    };

    const onTypingStart = ({ chatId: typedChatId }: any) => setTyping(typedChatId, true);
    const onTypingStop = ({ chatId: typedChatId }: any) => setTyping(typedChatId, false);
    
    const onChatEnded = ({ chatId: endedChatId, reason }: any) => {
      if (chatId === endedChatId) {
        Alert.alert('Chat Ended', `This chat has ended. (${reason})`);
        queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      }
    };

    const onWalletUpdate = ({ balance }: any) => {
      queryClient.setQueryData(['walletSummary'], (old: any) => 
        old ? { ...old, currentBalance: balance } : old
      );
    };

    socket.on('chat:receive_message', onMessage);
    socket.on('chat:typing_start', onTypingStart);
    socket.on('chat:typing_stop', onTypingStop);
    socket.on('chat:ended', onChatEnded);
    socket.on('wallet:update', onWalletUpdate);
    socket.on('chat:error', (data) => Alert.alert('Notice', data.message));

    return () => {
      if (chatId) socket.emit('chat:leave', { chatId });
      socket.off('chat:receive_message', onMessage);
      socket.off('chat:typing_start', onTypingStart);
      socket.off('chat:typing_stop', onTypingStop);
      socket.off('chat:ended', onChatEnded);
      socket.off('wallet:update', onWalletUpdate);
      socket.off('chat:error');
    };
  }, [socket, isConnected, chatId, queryClient, setTyping]);

  const sendMessage = (chatId: string, content: string, tempId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:send_message', { chatId, content, tempId }, (response: any) => {
        if (response.error) {
          Alert.alert('Error', response.error);
        } else {
          // The message was successful, update the cache with the real ID if needed.
          // Or wait for the server to acknowledge.
        }
      });
    }
  };

  const emitTyping = (chatId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit(isTyping ? 'chat:typing_start' : 'chat:typing_stop', { chatId });
    }
  };

  return { sendMessage, emitTyping };
};
