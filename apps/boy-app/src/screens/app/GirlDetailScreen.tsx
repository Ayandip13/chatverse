import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageCircle, Star, ShieldAlert, Clock, X } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/types';
import { useGirlDetails, useToggleFavorite } from '../../hooks/useDiscovery';
import { useRecentChats } from '../../hooks/useHomeData';
import { useSendChatRequest, useCancelChatRequest, useChats, useChatRequests } from '../../hooks/useMessaging';
import { useSocket } from '../../providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { getAvatarUrl } from '../../utils/avatarUtil';
import { Skeleton } from '../../components/ui/Skeleton';
import { CustomModal } from '../../components/ui/CustomModal';
import { ToastAndroid } from 'react-native';

export default function GirlDetailsScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'GirlDetailScreen'>>();
  const { id } = route.params;
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  
  const { data: girl, isLoading, isError } = useGirlDetails(id);
  const { mutate: toggleFavorite } = useToggleFavorite();
  
  const { mutateAsync: sendChatRequest, isPending: isSendingRequest } = useSendChatRequest();
  const { mutateAsync: cancelChatRequest, isPending: isCancelling } = useCancelChatRequest();

  const { data: chats } = useChats();
  const { data: recentChats } = useRecentChats();
  const { data: pendingRequests } = useChatRequests('PENDING');

  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'info' | 'danger';
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  // Find active chat or pending request for this creator
  const allChats = [...(chats || []), ...(recentChats || [])];
  const activeChat = allChats?.find(
    (c: any) =>
      (c.otherParticipant?._id === id || c.girlId === id || (typeof c.girlId === 'object' && c.girlId?._id === id)) &&
      c.status === 'ACTIVE'
  );

  const existingPendingReq = pendingRequests?.find(
    (r: any) =>
      (r.receiverId === id || (typeof r.receiverId === 'object' && r.receiverId?._id === id)) &&
      r.status === 'PENDING'
  );

  const pendingReqId = activeRequestId || existingPendingReq?._id;

  // Socket Listeners for Real-time status updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const onAccepted = (data: { requestId: string; chatId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
      setActiveRequestId(null);
      setModalConfig({
        title: 'Request Accepted! 🎉',
        message: 'The creator has accepted your chat request. Connect now!',
        type: 'success',
        confirmText: 'Start Chat',
        onConfirm: () => {
          setModalVisible(false);
          navigation.navigate('ChatScreen', { id: data.chatId });
        }
      });
      setModalVisible(true);
    };

    const onRejected = (data: { requestId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
      setActiveRequestId(null);
      ToastAndroid.show('The creator is currently unavailable or declined your request.', ToastAndroid.LONG);
    };

    socket.on('chat_request:accepted', onAccepted);
    socket.on('chat_request:rejected', onRejected);

    return () => {
      socket.off('chat_request:accepted', onAccepted);
      socket.off('chat_request:rejected', onRejected);
    };
  }, [socket, isConnected]);

  // Countdown timer for pending request modal
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (activeRequestId && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && activeRequestId) {
      setActiveRequestId(null);
      ToastAndroid.show('No response received within 60 seconds.', ToastAndroid.LONG);
    }
    return () => clearInterval(timer);
  }, [activeRequestId, countdown]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900">
        <View className="w-full h-[450px]">
          <Skeleton className="w-full h-full" borderRadius={0} />
          
          <SafeAreaView edges={['top']} className="absolute top-0 w-full flex-row justify-between px-6 pt-4">
            <View className="w-10 h-10 bg-black/10 rounded-full" />
            <View className="w-10 h-10 bg-black/10 rounded-full" />
          </SafeAreaView>

          <View className="absolute bottom-6 px-6 w-full flex-row justify-between items-end">
            <View>
              <Skeleton className="w-48 h-8 rounded-md mb-2 bg-white/50" />
              <Skeleton className="w-24 h-5 rounded-full bg-white/50" />
            </View>
            <View className="w-14 h-14 rounded-full bg-white/30" />
          </View>
        </View>

        <View className="px-6 py-6">
          <Skeleton className="w-32 h-6 rounded-md mb-4" />
          <Skeleton className="w-full h-4 rounded-md mb-2" />
          <Skeleton className="w-full h-4 rounded-md mb-2" />
          <Skeleton className="w-3/4 h-4 rounded-md mb-6" />

          <View className="flex-row gap-2">
            <Skeleton className="w-24 h-8 rounded-full" />
            <Skeleton className="w-24 h-8 rounded-full" />
          </View>
        </View>
      </View>
    );
  }

  if (isError || !girl) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-500">Could not load profile.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 bg-indigo-600 px-6 py-2 rounded-full">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleToggleFavorite = () => {
    toggleFavorite({ id: girl._id, isFavorite: !girl.isFavorite });
  };

  const handleStartChat = async () => {
    if (activeChat) {
      navigation.navigate('ChatScreen', { id: activeChat._id });
      return;
    }

    try {
      const res: any = await sendChatRequest(girl._id);
      if (res && res.data) {
        setActiveRequestId(res.data._id || res.data.id);
        setCountdown(60);
        queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to send chat request.';
      ToastAndroid.show(message, ToastAndroid.LONG);
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingReqId) return;
    try {
      await cancelChatRequest(pendingReqId);
      setActiveRequestId(null);
      queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to cancel request.';
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  // Determine button state according to business rules
  let buttonLabel = 'Send Chat Request';
  let isButtonDisabled = isSendingRequest;
  let buttonBg = 'bg-indigo-600 shadow-indigo-500/30';

  if (activeChat) {
    buttonLabel = 'Continue Chat';
    isButtonDisabled = false;
    buttonBg = 'bg-emerald-600 shadow-emerald-500/30';
  } else if (pendingReqId) {
    buttonLabel = 'Request Sent';
    isButtonDisabled = true;
    buttonBg = 'bg-indigo-400 opacity-90';
  }

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
              onPress={() => navigation.goBack()} 
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

          {/* Pending Request Banner */}
          {pendingReqId && !activeChat && (
            <View className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2 flex-1">
                <Clock size={20} color="#6366f1" />
                <Text className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex-1">
                  Request Pending - Waiting for response{activeRequestId ? ` (${countdown}s)` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancelRequest}
                disabled={isCancelling}
                className="px-3 py-1.5 bg-indigo-200 dark:bg-indigo-800 rounded-full"
              >
                <Text className="text-xs font-bold text-indigo-800 dark:text-indigo-200">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Chat Button */}
      <View className="absolute bottom-0 w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
        <SafeAreaView edges={['bottom']}>
          <TouchableOpacity 
            onPress={handleStartChat}
            disabled={isButtonDisabled}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-lg ${buttonBg}`}
          >
            {isSendingRequest ? (
              <ActivityIndicator color="#ffffff" className="mr-2" />
            ) : (
              <MessageCircle size={24} color="#ffffff" className="mr-2" />
            )}
            <Text className="text-white text-lg font-bold">
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {modalConfig && (
        <CustomModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          confirmText={modalConfig.confirmText}
          onConfirm={modalConfig.onConfirm}
          cancelText="Later"
          onCancel={() => setModalVisible(false)}
        />
      )}
    </View>
  );
}
