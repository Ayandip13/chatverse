import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageCircle, Star, ShieldAlert, Clock, X } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGirlDetails, useToggleFavorite } from '../../../src/hooks/useDiscovery';
import { useSendChatRequest, useCancelChatRequest } from '../../../src/hooks/useMessaging';
import { useSocket } from '../../../src/providers/SocketProvider';
import { getAvatarUrl } from '../../../src/utils/avatarUtil';

export default function GirlDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  
  const { data: girl, isLoading, isError } = useGirlDetails(id);
  const { mutate: toggleFavorite } = useToggleFavorite();
  
  const { mutateAsync: sendChatRequest, isPending: isSendingRequest } = useSendChatRequest();
  const { mutateAsync: cancelChatRequest, isPending: isCancelling } = useCancelChatRequest();

  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  // Socket Listeners for Real-time status updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const onAccepted = (data: { requestId: string; chatId: string }) => {
      if (data.requestId === activeRequestId || activeRequestId) {
        setActiveRequestId(null);
        Alert.alert('Request Accepted!', 'Connecting you to the chat session...', [
          { text: 'Start Chat', onPress: () => router.push(`/chat/${data.chatId}`) }
        ]);
        router.push(`/chat/${data.chatId}`);
      }
    };

    const onRejected = (data: { requestId: string }) => {
      if (data.requestId === activeRequestId) {
        setActiveRequestId(null);
        Alert.alert('Request Declined', 'The creator is currently unavailable or declined your request.');
      }
    };

    const onExpired = (data: { requestId: string }) => {
      if (data.requestId === activeRequestId) {
        setActiveRequestId(null);
        Alert.alert('Request Expired', 'The request expired because there was no response within 60 seconds.');
      }
    };

    socket.on('chat_request:accepted', onAccepted);
    socket.on('chat_request:rejected', onRejected);
    socket.on('chat_request:expired', onExpired);

    return () => {
      socket.off('chat_request:accepted', onAccepted);
      socket.off('chat_request:rejected', onRejected);
      socket.off('chat_request:expired', onExpired);
    };
  }, [socket, isConnected, activeRequestId]);

  // Countdown timer for pending request modal
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeRequestId && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && activeRequestId) {
      setActiveRequestId(null);
      Alert.alert('Request Expired', 'No response received within 60 seconds.');
    }
    return () => clearInterval(timer);
  }, [activeRequestId, countdown]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (isError || !girl) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-500">Could not load profile.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-indigo-600 px-6 py-2 rounded-full">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleToggleFavorite = () => {
    toggleFavorite({ id: girl._id, isFavorite: !girl.isFavorite });
  };

  const handleStartChat = async () => {
    try {
      const res = await sendChatRequest(girl._id);
      if (res && res.data) {
        setActiveRequestId(res.data._id || res.data.id);
        setCountdown(60);
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to send chat request.';
      Alert.alert('Unable to Request Chat', message);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRequestId) return;
    try {
      await cancelChatRequest(activeRequestId);
      setActiveRequestId(null);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to cancel request.';
      Alert.alert('Error', message);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Photos Header */}
        <View className="relative w-full h-[450px]">
          <Image 
            source={{ uri: getAvatarUrl(girl.avatar, girl.name, girl._id) }} 
            className="w-full h-full"
            style={{ resizeMode: 'cover' }}
          />
          <View className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-black/30" />
          
          {/* Top Actions */}
          <SafeAreaView edges={['top']} className="absolute top-0 w-full flex-row justify-between px-6 pt-4">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md"
            >
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md"
            >
              <ShieldAlert size={20} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Bottom Info overlay */}
          <View className="absolute bottom-6 px-6 w-full flex-row justify-between items-end">
            <View>
              <View className="flex-row items-center mb-1">
                <Text className="text-white text-3xl font-extrabold mr-2 shadow-sm">{girl.name}</Text>
                {girl.isOnline && (
                  <View className="bg-green-500 px-2 py-1 rounded-full shadow-sm">
                    <Text className="text-white text-[10px] font-bold">ONLINE</Text>
                  </View>
                )}
              </View>
              
              <View className="flex-row items-center bg-black/40 px-3 py-1.5 rounded-full self-start backdrop-blur-md">
                <Star size={14} color="#fbbf24" fill="#fbbf24" className="mr-1" />
                <Text className="text-white text-xs font-bold">
                  {girl.averageRating?.toFixed(1) || 'NEW'} 
                  <Text className="text-gray-300 font-normal"> ({girl.totalReviews || 0} reviews)</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleToggleFavorite}
              className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${
                girl.isFavorite ? 'bg-white' : 'bg-black/40 backdrop-blur-md border border-white/20'
              }`}
            >
              <Heart 
                size={24} 
                color={girl.isFavorite ? "#ef4444" : "#ffffff"} 
                fill={girl.isFavorite ? "#ef4444" : "transparent"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Body */}
        <View className="px-6 py-6 pb-32">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">About Me</Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {girl.bio || "Hi there! I'm new here and looking forward to chatting."}
          </Text>

          {/* Stats/Badges */}
          <View className="flex-row flex-wrap gap-2 mb-8">
            <View className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-800">
              <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">Top Rated</Text>
            </View>
            <View className="bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800">
              <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Fast Replier</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Chat Button */}
      <View className="absolute bottom-0 w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
        <SafeAreaView edges={['bottom']}>
          <TouchableOpacity 
            onPress={handleStartChat}
            disabled={isSendingRequest || !!activeRequestId}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-lg ${
              isSendingRequest || activeRequestId ? 'bg-indigo-400' : 'bg-indigo-600 shadow-indigo-500/30'
            }`}
          >
            {isSendingRequest ? (
              <ActivityIndicator color="#ffffff" className="mr-2" />
            ) : (
              <MessageCircle size={24} color="#ffffff" className="mr-2" />
            )}
            <Text className="text-white text-lg font-bold">
              {activeRequestId ? 'Request Pending...' : 'Send Chat Request'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Pending Request Modal */}
      <Modal visible={!!activeRequestId} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-gray-800 w-full p-6 rounded-3xl items-center shadow-2xl">
            <View className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/40 rounded-full items-center justify-center mb-4">
              <Clock size={32} color="#4f46e5" />
            </View>

            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Waiting for Response
            </Text>

            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Request sent to <Text className="font-bold text-gray-800 dark:text-gray-200">{girl.name}</Text>. Waiting for acceptance...
            </Text>

            {/* Countdown Badge */}
            <View className="bg-indigo-100 dark:bg-indigo-900/60 px-6 py-2 rounded-full mb-6">
              <Text className="text-indigo-700 dark:text-indigo-300 font-extrabold text-lg">
                00:{countdown < 10 ? `0${countdown}` : countdown}
              </Text>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={handleCancelRequest}
              disabled={isCancelling}
              className="w-full bg-gray-100 dark:bg-gray-700 py-3 rounded-2xl items-center flex-row justify-center"
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#6b7280" className="mr-2" />
              ) : (
                <X size={18} color="#6b7280" className="mr-2" />
              )}
              <Text className="text-gray-700 dark:text-gray-300 font-bold text-base">
                Cancel Request
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
