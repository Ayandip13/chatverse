import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, User, Coins, PhoneOff, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { useChatDetails, useChatMessages, useEndChat } from '../../../src/hooks/useMessaging';
import { useChatSocket } from '../../../src/hooks/useChatSocket';
import { theme } from '../../../src/constants/theme';
import { getAvatarUrl } from '../../../src/utils/avatarUtil';

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

  const { mutate: endChatSessionApi, isPending: isEnding } = useEndChat();
  const { sendMessage, emitTyping, endChatSession, isOtherUserTyping, chatTick, endedSummary } = useChatSocket(id);

  const [inputMessage, setInputMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

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
          endChatSession(id);
        }
      }
    ]);
  };

  const handleCloseSummary = () => {
    router.replace('/(app)/dashboard');
  };

  const completedMinutes = chatTick?.completedMinutes || chat.durationInMinutes || 0;
  const currentEarnings = completedMinutes * 8;
  const elapsedSeconds = chatTick?.elapsedSeconds || 0;
  const minutesStr = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const secondsStr = (elapsedSeconds % 60).toString().padStart(2, '0');

  const otherUser = chat.otherParticipant || chat.boyId;

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
              <Image source={{ uri: getAvatarUrl(otherUser?.avatar, otherUser?.name, otherUser?._id) }} className="w-full h-full" />
            </View>

            <View>
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                {otherUser?.name || 'User'}
              </Text>
              <Text className="text-xs text-slate-400">Active Chat Session</Text>
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
          <View className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#ffffff" />
              <Text className="text-white text-xs font-mono font-bold">
                {minutesStr}:{secondsStr} (+8 coins/min)
              </Text>
            </View>
            <View className="flex-row items-center bg-white/20 px-3 py-1 rounded-full border border-white/30">
              <Coins size={14} color="#ffffff" className="mr-1" />
              <Text className="text-white text-xs font-extrabold font-mono">
                {currentEarnings} Coins Earned
              </Text>
            </View>
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

      {/* Session Completed Earnings Summary Modal */}
      <Modal visible={!!endedSummary} transparent animationType="slide">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-slate-800 w-full p-6 rounded-3xl items-center shadow-2xl border border-slate-200 dark:border-slate-700">
            <View className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/40 rounded-full items-center justify-center mb-4">
              <CheckCircle2 size={36} color="#10b981" />
            </View>

            <Text className="text-xl font-extrabold text-slate-900 dark:text-white text-center mb-1">
              Session Completed!
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6">
              Reason: {endedSummary?.reason || 'Completed'}
            </Text>

            {/* Earnings Breakdown */}
            <View className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl mb-6 flex-row justify-around border border-slate-100 dark:border-slate-800">
              <View className="items-center">
                <Clock size={20} color="#64748b" className="mb-1" />
                <Text className="text-xs text-slate-400 font-medium">Billed Duration</Text>
                <Text className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {endedSummary?.finalDuration || 0} mins
                </Text>
              </View>

              <View className="w-[1px] bg-slate-200 dark:bg-slate-800 h-full" />

              <View className="items-center">
                <Coins size={20} color="#10b981" className="mb-1" />
                <Text className="text-xs text-slate-400 font-medium">Total Earned</Text>
                <Text className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                  +{(endedSummary?.finalDuration || 0) * 8} Coins
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleCloseSummary}
              className="w-full bg-pink-600 py-3.5 rounded-2xl items-center shadow-lg shadow-pink-500/30"
            >
              <Text className="text-white font-bold text-base">Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
