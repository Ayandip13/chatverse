import { useEffect, useRef, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, KeyboardAvoidingView, Platform, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { useChatDetails, useChatMessages } from '../../../src/hooks/useMessaging';
import { useChatSocket } from '../../../src/hooks/useChatSocket';
import { useChatStore } from '../../../src/store/chatStore';

import { ChatHeader } from '../../../src/components/chat/ChatHeader';
import { CoinTimerCard } from '../../../src/components/chat/CoinTimerCard';
import { MessageBubble } from '../../../src/components/chat/MessageBubble';
import { ChatInput } from '../../../src/components/chat/ChatInput';
import { CheckCircle2, Clock, Coins, XCircle } from 'lucide-react-native';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = useAuthStore(state => state.user?._id);
  const { data: chat, isLoading: isChatLoading, isError } = useChatDetails(id);
  
  const { 
    data: messagesData, 
    isLoading: isMessagesLoading, 
    fetchNextPage, 
    hasNextPage,
    isFetchingNextPage
  } = useChatMessages(id);

  const { sendMessage, emitTyping, endChatSession, chatTick, lowBalanceWarning, endedSummary } = useChatSocket(id);
  
  const typingUsers = useChatStore(state => state.typingUsers);
  const isOtherUserTyping = typingUsers[id];

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
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
    sendMessage(id, text, Date.now().toString());
  };

  const handleCloseSummary = () => {
    router.replace('/(app)/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ChatHeader chat={chat} />
        {chat.status === 'ACTIVE' && (
          <CoinTimerCard chat={chat} chatTick={chatTick} lowBalanceWarning={lowBalanceWarning} />
        )}

        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item) => item._id}
          inverted
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

      {/* Session Ended Summary Modal */}
      <Modal visible={!!endedSummary} transparent animationType="slide">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-gray-800 w-full p-6 rounded-3xl items-center shadow-2xl border border-gray-100 dark:border-gray-700">
            <View className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/40 rounded-full items-center justify-center mb-4">
              <CheckCircle2 size={36} color="#4f46e5" />
            </View>

            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
              Chat Session Completed
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">
              Reason: {endedSummary?.reason || 'Session ended'}
            </Text>

            {/* Stats Breakdown */}
            <View className="w-full bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl mb-6 flex-row justify-around border border-gray-100 dark:border-gray-800">
              <View className="items-center">
                <Clock size={20} color="#6366f1" className="mb-1" />
                <Text className="text-xs text-gray-400 font-medium">Billed Time</Text>
                <Text className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {endedSummary?.finalDuration || 0} mins
                </Text>
              </View>

              <View className="w-[1px] bg-gray-200 dark:bg-gray-800 h-full" />

              <View className="items-center">
                <Coins size={20} color="#fbbf24" className="mb-1" />
                <Text className="text-xs text-gray-400 font-medium">Total Cost</Text>
                <Text className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
                  {endedSummary?.finalCost || 0} coins
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleCloseSummary}
              className="w-full bg-indigo-600 py-3.5 rounded-2xl items-center shadow-md shadow-indigo-500/30"
            >
              <Text className="text-white font-bold text-base">Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
