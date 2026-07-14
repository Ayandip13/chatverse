import { useEffect, useRef } from 'react';
import { View, FlatList, ActivityIndicator, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { useChatDetails, useChatMessages } from '../../../src/hooks/useMessaging';
import { useChatSocket } from '../../../src/hooks/useChatSocket';
import { useChatStore } from '../../../src/store/chatStore';

import { ChatHeader } from '../../../src/components/chat/ChatHeader';
import { CoinTimerCard } from '../../../src/components/chat/CoinTimerCard';
import { MessageBubble } from '../../../src/components/chat/MessageBubble';
import { ChatInput } from '../../../src/components/chat/ChatInput';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore(state => state.user?._id); // extract from token state
  const { data: chat, isLoading: isChatLoading, isError } = useChatDetails(id);
  
  const { 
    data: messagesData, 
    isLoading: isMessagesLoading, 
    fetchNextPage, 
    hasNextPage,
    isFetchingNextPage
  } = useChatMessages(id);

  const { sendMessage, emitTyping } = useChatSocket(id);
  
  const typingUsers = useChatStore(state => state.typingUsers);
  const isOtherUserTyping = typingUsers[id];

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Set active chat ID in store
    useChatStore.getState().setActiveChatId(id);
    return () => useChatStore.getState().setActiveChatId(null);
  }, [id]);

  if (isChatLoading || isMessagesLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (isError || !chat) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-500">Failed to load chat.</Text>
      </View>
    );
  }

  const allMessages = messagesData?.pages.flatMap(p => p.messages) || [];

  const handleSend = (text: string) => {
    // We pass a tempId to the socket for optimistic updates if we wanted full complexity
    // But currently the socket hook handles appending on receive for simplicity.
    sendMessage(id, text, Date.now().toString());
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ChatHeader chat={chat} />
        {chat.status === 'ACTIVE' && <CoinTimerCard chat={chat} />}

        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item) => item._id}
          inverted // Flips the list so bottom is index 0
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              isOwnMessage={item.senderId === userId} 
            />
          )}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator size="small" color="#4f46e5" className="my-4" /> : null
          }
          ListHeaderComponent={
            isOtherUserTyping ? (
              <View className="flex-row items-center mb-4">
                <View className="bg-gray-200 dark:bg-gray-800 rounded-full px-3 py-2">
                  <Text className="text-gray-500 dark:text-gray-400 text-xs italic">Typing...</Text>
                </View>
              </View>
            ) : null
          }
        />

        <ChatInput 
          onSend={handleSend} 
          onTyping={(isTyping) => emitTyping(id, isTyping)} 
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
