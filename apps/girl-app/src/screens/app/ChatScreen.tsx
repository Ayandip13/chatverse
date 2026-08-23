import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Platform, TouchableOpacity, TextInput, Image, Alert, Modal, StatusBar } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Send, User, Coins, PhoneOff, CheckCircle2, Clock, Sparkles, Smile, Image as ImageIcon, Reply, X, CornerDownRight, Upload, Mic, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useChatDetails, useChatMessages, useEndChat } from '../../hooks/useMessaging';
import { useChatSocket } from '../../hooks/useChatSocket';
import { theme } from '../../constants/theme';
import { getAvatarUrl, getMediaUrl } from '../../utils/avatarUtil';
import { Message } from '../../api/messagingApi';
import { MessageStatusTicks } from '../../components/chat/MessageStatusTicks';
import { VoicePlayer } from '../../components/chat/VoicePlayer';
import { useAudioRecorder, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';

const QUICK_EMOJIS = ['❤️', '🔥', '👍', '😂', '😍', '🎉', '💯', '✨'];

export default function GirlChatScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'android' ? Math.max(insets.top, StatusBar.currentHeight || 24) : insets.top;
  const route = useRoute<any>();
  const { id } = route.params;
  const navigation = useNavigation<any>();
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
  const { sendMessage, emitTyping, endChatSession, isOtherUserTyping, chatStats, endedSummary, disconnectState } = useChatSocket(id);

  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Hardware-accelerated keyboard sync
  const keyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true });
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: keyboard.height.value > 0 ? Math.max(keyboard.height.value - insets.bottom, 0) : 0,
    };
  });

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const [localSeconds, setLocalSeconds] = useState(0);

  useEffect(() => {
    if (chatStats?.elapsedSeconds !== undefined) {
      setLocalSeconds(chatStats.elapsedSeconds);
    }
  }, [chatStats?.elapsedSeconds]);

  useEffect(() => {
    if (chat?.status !== 'ACTIVE') return;

    if (chat?.startTime) {
      const elapsed = Math.floor((Date.now() - new Date(chat.startTime).getTime()) / 1000);
      if (elapsed >= 0) {
        setLocalSeconds(elapsed);
      }
    }

    const interval = setInterval(() => {
      setLocalSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [chat?.status, chat?.startTime]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioRecorder.stop().catch(() => {});
    };
  }, []);

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
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 bg-pink-600 px-6 py-2 rounded-full">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allMessages = messagesData?.pages.flatMap(p => p.messages) || [];

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    let finalContent = inputMessage.trim();
    if (replyingTo) {
      const quoteExcerpt = replyingTo.content.replace(/^\[(IMAGE|REPLY|VOICE):.*?\]:/, '').substring(0, 50);
      finalContent = `[REPLY:${quoteExcerpt}]:${finalContent}`;
      setReplyingTo(null);
    }

    sendMessage(id, finalContent, Date.now().toString());
    setInputMessage('');
    emitTyping(id, false);
    setShowEmojiBar(false);
  };

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required to record voice notes.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('Error starting voice recording:', error);
      Alert.alert('Recording Error', 'Could not start audio recording.');
    }
  };

  const cancelRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    try {
      await audioRecorder.stop();
    } catch (e) {}

    await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const stopAndSendRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    try {
      setIsUploadingImage(true);
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});

      const uri = audioRecorder.uri;
      const duration = recordingDuration;
      setIsRecording(false);
      setRecordingDuration(0);

      if (!uri) {
        Alert.alert('Recording Failed', 'Could not retrieve voice recording.');
        setIsUploadingImage(false);
        return;
      }

      const filename = uri.split('/').pop() || `voice_${Date.now()}.m4a`;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type: 'audio/m4a',
      } as any);

      const response = await apiClient.post('/chats/upload', formData, {
        transformRequest: (data) => data,
        headers: { 'Accept': 'application/json' },
      });

      const uploadedUrl = response.data?.data?.url;
      if (uploadedUrl) {
        sendMessage(id, `[VOICE:${duration}]:${uploadedUrl}`, Date.now().toString());
      } else {
        Alert.alert('Upload Failed', 'Could not retrieve uploaded audio URL.');
      }
    } catch (error: any) {
      console.error('Error sending voice message:', error);
      Alert.alert('Upload Error', error?.response?.data?.message || error.message || 'Failed to send voice note.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePickAndSendImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access gallery is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingImage(true);
        setShowImageModal(false);
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'chat_image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        const formData = new FormData();
        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        const response = await apiClient.post('/chats/upload', formData, {
          transformRequest: (data) => data,
          headers: { 'Accept': 'application/json' },
        });

        const uploadedUrl = response.data?.data?.url;
        if (uploadedUrl) {
          sendMessage(id, `[IMAGE]:${uploadedUrl}`, Date.now().toString());
        } else {
          Alert.alert('Upload Failed', 'Could not retrieve uploaded image URL.');
        }
      }
    } catch (error: any) {
      console.error('Error picking/uploading chat image:', error);
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to upload image from gallery');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSendImageLink = () => {
    if (!imageUrlInput.trim() || !imageUrlInput.startsWith('http')) {
      Alert.alert('Invalid URL', 'Please enter a valid HTTP/HTTPS image URL.');
      return;
    }
    sendMessage(id, `[IMAGE]:${imageUrlInput.trim()}`, Date.now().toString());
    setImageUrlInput('');
    setShowImageModal(false);
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
    navigation.replace('Dashboard');
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const messagesBilled = chatStats?.messagesSent || chat.totalCost || 0;
  const currentEarnings = messagesBilled; // 1 coin per message earned

  const otherUser = chat.otherParticipant || (typeof chat.boyId === 'object' ? chat.boyId : undefined);

  return (
    <Animated.View 
      className="flex-1 bg-slate-50 dark:bg-slate-900" 
      style={[{ flex: 1 }, animatedContainerStyle]}
    >
      {/* Top Header with Safe Area Inset to clear status bar */}
      <View style={{ paddingTop: topInset }} className="bg-white dark:bg-slate-800">
        {/* Chat Header */}
        <View className="flex-row items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-1">
              <ArrowLeft size={22} color={theme.colors.text.secondary.light} />
            </TouchableOpacity>

            <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600">
              <Image source={{ uri: getAvatarUrl(otherUser?.avatar, otherUser?.name, otherUser?._id, 'BOY') }} className="w-full h-full" />
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
      </View>

      {/* Live Earnings Banner */}
      {chat.status === 'ACTIVE' && (
        <View className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 flex-row items-center justify-between shadow-sm">
          <View className="flex-row items-center gap-2">
            <Clock size={15} color="#ffffff" />
            <Text className="text-white text-xs font-mono font-bold">
              {formatTimer(localSeconds)}
            </Text>
            <Text className="text-emerald-100 text-[10px] font-medium">
              (+1 coin/min)
            </Text>
          </View>
          <View className="flex-row items-center bg-white/20 px-3 py-1 rounded-full border border-white/30">
            <Coins size={13} color="#ffffff" className="mr-1" />
            <Text className="text-white text-xs font-extrabold font-mono">
              {currentEarnings} Coins Earned
            </Text>
          </View>
        </View>
      )}

        {/* Disconnect Reconnection Banner */}
        {disconnectState && (
          <View className="bg-amber-500 px-6 py-2 flex-row items-center justify-between shadow-sm">
            <Text className="text-white text-xs font-bold flex-1" numberOfLines={1}>
              ⚠️ User disconnected. Waiting for reconnection ({disconnectState.graceSeconds}s)...
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
          className="flex-1"
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isOwn = item.senderId === userId;
            const rawContent = item.content || '';
            const isVoice = rawContent.startsWith('[VOICE');
            const isImage = rawContent.startsWith('[IMAGE]:');
            const isReply = rawContent.startsWith('[REPLY:');

            let voiceUrl = '';
            let voiceDuration = 0;
            if (isVoice) {
              const match = /^\[VOICE(?::(\d+))?\]:(.*)$/.exec(rawContent.trim());
              if (match) {
                voiceDuration = match[1] ? parseInt(match[1], 10) : 0;
                voiceUrl = match[2].trim();
              } else {
                voiceUrl = rawContent.replace(/^\[VOICE.*?\]:/, '').trim();
              }
            }

            let imageUrl = '';
            if (isImage) imageUrl = rawContent.replace('[IMAGE]:', '').trim();
            const resolvedImageUrl = getMediaUrl(imageUrl);

            let quotedText = '';
            let actualBody = rawContent;
            if (isReply) {
              const endQuoteIdx = rawContent.indexOf(']:');
              if (endQuoteIdx !== -1) {
                quotedText = rawContent.substring(7, endQuoteIdx);
                actualBody = rawContent.substring(endQuoteIdx + 2);
              }
            }

            return (
              <View className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <View 
                  className={`max-w-[80%] p-3.5 rounded-2xl ${
                    isOwn 
                      ? 'bg-rose-500 rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  {/* Reply Button for incoming message */}
                  {!isOwn && (
                    <TouchableOpacity onPress={() => setReplyingTo(item)} className="self-end mb-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-full opacity-60">
                      <Reply size={12} color="#e11d48" />
                    </TouchableOpacity>
                  )}

                  {/* Quoted Reply Banner */}
                  {isReply && (
                    <View className={`p-2.5 rounded-xl mb-2 border-l-4 ${
                      isOwn ? 'bg-rose-600/60 border-rose-200' : 'bg-slate-100 dark:bg-slate-700/60 border-rose-500'
                    }`}>
                      <Text className={`text-xs font-bold ${isOwn ? 'text-rose-100' : 'text-rose-600'}`}>Replying to</Text>
                      <Text className={`text-xs italic mt-0.5 ${isOwn ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} numberOfLines={2}>
                        "{quotedText}"
                      </Text>
                    </View>
                  )}

                  {/* Message Content */}
                  {isVoice ? (
                    <VoicePlayer audioUrl={voiceUrl} durationSeconds={voiceDuration} isOwnMessage={isOwn} />
                  ) : isImage ? (
                    <TouchableOpacity onPress={() => setViewingImageUrl(resolvedImageUrl)} className="rounded-xl overflow-hidden mb-1">
                      <Image source={{ uri: resolvedImageUrl }} className="w-56 h-56 rounded-xl bg-slate-200" resizeMode="cover" />
                    </TouchableOpacity>
                  ) : (
                    <Text className={`text-sm leading-relaxed ${isOwn ? 'text-white font-medium' : 'text-slate-800 dark:text-slate-100'}`}>
                      {actualBody}
                    </Text>
                  )}

                  <View className="flex-row items-center justify-end gap-1 mt-1">
                    <Text className={`text-[10px] ${isOwn ? 'text-rose-100' : 'text-slate-400'}`}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isOwn && (
                      <View className="ml-0.5">
                        <MessageStatusTicks status={item.status || 'SENT'} size={14} />
                      </View>
                    )}
                  </View>
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

        {/* Quote Reply Preview Banner */}
        {replyingTo && (
          <View className="px-4 py-2 bg-rose-50 dark:bg-rose-900/30 flex-row items-center justify-between border-t border-rose-200 dark:border-rose-800">
            <View className="flex-row items-center gap-2 flex-1">
              <CornerDownRight size={16} color="#e11d48" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">Replying to Message</Text>
                <Text className="text-xs text-slate-600 dark:text-slate-300" numberOfLines={1}>
                  {replyingTo.content}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => setReplyingTo(null)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700">
              <X size={14} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Emoji Bar */}
        {showEmojiBar && (
          <View className="px-4 py-2 bg-slate-100 dark:bg-slate-800 flex-row justify-around border-t border-slate-200 dark:border-slate-700">
            {QUICK_EMOJIS.map((emoji, i) => (
              <TouchableOpacity key={i} onPress={() => setInputMessage((prev) => prev + emoji)} className="p-1">
                <Text className="text-xl">{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom Input Area with Safe Area Background */}
        <View className="bg-white dark:bg-slate-800" style={{ paddingBottom: insets.bottom }}>
          {chat.status !== 'ACTIVE' ? (
            <View className="px-4 py-4 items-center justify-center border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">This chat session has ended.</Text>
            </View>
          ) : isRecording ? (
            /* Active Voice Recording Bar */
            <View className="px-4 py-3 flex-row items-center justify-between bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900">
              <View className="flex-row items-center gap-3">
                <View className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
                <Text className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                  Recording... {formatTimer(recordingDuration)}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={cancelRecording}
                  className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-700"
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={stopAndSendRecording}
                  className="px-4 py-2.5 rounded-full bg-pink-600 flex-row items-center gap-1.5 shadow-md shadow-pink-500/30"
                >
                  <Send size={16} color="#ffffff" />
                  <Text className="text-white font-bold text-xs">Send Voice</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Standard Input Bar */
            <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 gap-2">
              <TouchableOpacity onPress={() => setShowEmojiBar((prev) => !prev)} className="p-1">
                <Smile size={22} color={showEmojiBar ? '#e11d48' : '#94a3b8'} />
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePickAndSendImage} disabled={isUploadingImage} className="p-1">
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color="#e11d48" />
                ) : (
                  <ImageIcon size={22} color="#94a3b8" />
                )}
              </TouchableOpacity>

              <TextInput
                value={inputMessage}
                onChangeText={handleTextChange}
                placeholder="Type a message..."
                placeholderTextColor="#94a3b8"
                className="flex-1 bg-slate-100 dark:bg-slate-900 px-4 py-3 rounded-full text-slate-900 dark:text-white text-sm"
              />
              {inputMessage.trim() ? (
                <TouchableOpacity 
                  onPress={handleSend}
                  className="w-11 h-11 rounded-full items-center justify-center bg-pink-600 shadow-md shadow-pink-500/30"
                >
                  <Send size={18} color="#ffffff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={startRecording}
                  disabled={isUploadingImage}
                  className="w-11 h-11 rounded-full items-center justify-center bg-pink-600 shadow-md shadow-pink-500/30"
                >
                  <Mic size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>


      {/* Expandable Image Modal */}
      <Modal visible={!!viewingImageUrl} transparent animationType="fade">
        <View className="flex-1 bg-black/90 items-center justify-center p-4">
          <TouchableOpacity onPress={() => setViewingImageUrl(null)} className="absolute top-12 right-6 p-3 bg-white/20 rounded-full">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          {viewingImageUrl && (
            <Image source={{ uri: viewingImageUrl }} className="w-full h-4/5 rounded-2xl" resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Share Image URL Modal */}
      <Modal visible={showImageModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-slate-800 w-full p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Send Image</Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)} className="p-1 rounded-full bg-slate-100 dark:bg-slate-700">
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Gallery Choice Button */}
            <TouchableOpacity 
              onPress={handlePickAndSendImage}
              disabled={isUploadingImage}
              className="w-full bg-pink-600 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 mb-4 shadow-lg shadow-pink-500/30"
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Upload size={18} color="#ffffff" />
                  <Text className="text-white font-bold text-base">Choose from Gallery</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-2">
              <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700" />
              <Text className="mx-3 text-xs text-slate-400 font-medium">OR PASTE LINK</Text>
              <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700" />
            </View>

            <TextInput
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
              placeholder="Paste Image HTTP/HTTPS URL..."
              placeholderTextColor="#94a3b8"
              className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl px-4 h-12 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm my-3 font-mono"
            />

            <TouchableOpacity 
              onPress={handleSendImageLink}
              disabled={!imageUrlInput.trim()}
              className={`w-full py-3.5 rounded-2xl items-center ${
                imageUrlInput.trim() ? 'bg-slate-900 dark:bg-slate-700' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <Text className="text-white font-bold text-base">Send Image Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


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
                <Text className="text-xs text-slate-400 font-medium">Messages Sent</Text>
                <Text className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {endedSummary?.finalCost || 0} msgs
                </Text>
              </View>

              <View className="w-[1px] bg-slate-200 dark:bg-slate-800 h-full" />

              <View className="items-center">
                <Coins size={20} color="#10b981" className="mb-1" />
                <Text className="text-xs text-slate-400 font-medium">Total Earned</Text>
                <Text className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                  +{(endedSummary?.finalCost || 0)} Coins
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
    </Animated.View>
  );
}
