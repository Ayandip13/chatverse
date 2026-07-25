import { useEffect, useState } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '../api/messagingApi';
import { Alert } from 'react-native';

export const useChatSocket = (chatId?: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

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
            messages: [message, ...newPages[0].messages]
          };
        }
        return { ...oldData, pages: newPages };
      });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    };

    const onTypingStart = ({ chatId: typedChatId }: any) => {
      if (typedChatId === chatId) setIsOtherUserTyping(true);
    };

    const onTypingStop = ({ chatId: typedChatId }: any) => {
      if (typedChatId === chatId) setIsOtherUserTyping(false);
    };
    
    const onChatEnded = ({ chatId: endedChatId, reason }: any) => {
      if (chatId === endedChatId) {
        Alert.alert('Chat Ended', `The chat session has ended (${reason || 'Completed'}).`);
        queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }
    };

    socket.on('chat:receive_message', onMessage);
    socket.on('chat:typing_start', onTypingStart);
    socket.on('chat:typing_stop', onTypingStop);
    socket.on('chat:ended', onChatEnded);

    return () => {
      if (chatId) socket.emit('chat:leave', { chatId });
      socket.off('chat:receive_message', onMessage);
      socket.off('chat:typing_start', onTypingStart);
      socket.off('chat:typing_stop', onTypingStop);
      socket.off('chat:ended', onChatEnded);
    };
  }, [socket, isConnected, chatId, queryClient]);

  const sendMessage = (chatId: string, content: string, tempId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:send_message', { chatId, content, tempId }, (response: any) => {
        if (response && response.error) {
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

  return { sendMessage, emitTyping, isOtherUserTyping };
};
