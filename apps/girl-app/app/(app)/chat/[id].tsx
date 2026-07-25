import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, User, Coins, PhoneOff } from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { useChatDetails, useChatMessages, useEndChat } from '../../../src/hooks/useMessaging';
import { useChatSocket } from '../../../src/hooks/useChatSocket';
import { theme } from '../../../src/constants/theme';

export default function GirlChatScreen() {
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

  const { mutate: endChatSession, isPending: isEnding } = useEndChat();
  const { sendMessage, emitTyping, isOtherUserTyping } = useChatSocket(id);

  const [inputMessage, setInputMessage] = useState('');
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Earnings timer (8 coins / min)
  useEffect(() => {
    if (!chat || chat.status !== 'ACTIVE') return;
    const interval = setInterval(() => {
      const start = new Date(chat.startTime).getTime();
      const now = new Date().getTime();
      const mins = Math.floor((now - start) / 60000);
      setElapsedMinutes(mins);
    }, 5000);
    return () => clearInterval(interval);
  }, [chat]);

  if (isChatLoading || isMessagesLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  if (isError || !chat) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <Text className="text-slate-500">Failed to load chat.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-pink-600 px-6 py-2 rounded-full">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allMessages = messagesData?.pages.flatMap(p => p.messages) || [];

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    sendMessage(id, inputMessage.trim(), Date.now().toString());
    setInputMessage('');
    emitTyping(id, false);
  };

  const handleTextChange = (text: string) => {
    setInputMessage(text);
    emitTyping(id, text.length > 0);
  };

  const handleEndChat = () => {
    Alert.alert('End Chat Session', 'Are you sure you want to end this chat session?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'End Chat', 
        style: 'destructive',
        onPress: () => {
          endChatSession(id, {
            onSuccess: () => router.back()
          });
        }
      }
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Header */}
        <View className="flex-row items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} className="mr-1">
              <ArrowLeft size={22} color={theme.colors.text.secondary.light} />
            </TouchableOpacity>

            <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600">
              {chat.boyId?.avatar ? (
                <Image source={{ uri: chat.boyId.avatar }} className="w-full h-full" />
              ) : (
                <User color={theme.colors.secondary} size={20} />
              )}
            </View>

            <View>
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                {chat.boyId?.name || 'User'}
              </Text>
              <Text className="text-xs text-slate-400">Active Session</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleEndChat}
            disabled={isEnding}
            className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800"
          >
            <PhoneOff size={18} color="#e11d48" />
          </TouchableOpacity>
        </View>

        {/* Live Earnings Banner */}
        {chat.status === 'ACTIVE' && (
          <View className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center gap-2">
              <Coins size={18} color="#ffffff" />
              <Text className="text-white text-xs font-bold">
                Earnings Accumulating: +8 Coins/min
              </Text>
            </View>
            <Text className="text-white text-xs font-extrabold">
              Total: ~{elapsedMinutes * 8} Coins
            </Text>
          </View>
        )}

        {/* Message Stream */}
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item) => item._id}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isOwn = item.senderId === userId;
            return (
              <View className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <View 
                  className={`max-w-[78%] px-4 py-3 rounded-2xl ${
                    isOwn 
                      ? 'bg-rose-500 rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  <Text className={`text-sm leading-relaxed ${isOwn ? 'text-white font-medium' : 'text-slate-800 dark:text-slate-100'}`}>
                    {item.content}
                  </Text>
                </View>
              </View>
            );
          }}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator size="small" color="#e11d48" className="my-4" /> : null
          }
          ListHeaderComponent={
            isOtherUserTyping ? (
              <View className="flex-row items-center mb-4">
                <View className="bg-slate-200 dark:bg-slate-800 rounded-full px-3 py-1.5">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs italic">User is typing...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input Bar */}
        <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 gap-2">
          <TextInput
            value={inputMessage}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            className="flex-1 bg-slate-100 dark:bg-slate-900 px-4 py-3 rounded-full text-slate-900 dark:text-white text-sm"
          />
          <TouchableOpacity 
            onPress={handleSend}
            disabled={!inputMessage.trim()}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              inputMessage.trim() ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
