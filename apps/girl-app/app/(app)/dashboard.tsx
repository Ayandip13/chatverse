import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { Button } from '../../src/components/ui/Button';
import { Heart, Sparkles, User, LogOut, MessageCircle, Clock, Check, X, PhoneCall, Edit3, Wallet } from 'lucide-react-native';
import { theme } from '../../src/constants/theme';
import { useRouter } from 'expo-router';
import { useSocket } from '../../src/providers/SocketProvider';
import { useAcceptChatRequest, useRejectChatRequest, useChatRequests } from '../../src/hooks/useMessaging';
import { getAvatarUrl } from '../../src/utils/avatarUtil';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { socket, isConnected } = useSocket();

  const { data: pendingRequests, refetch: refetchRequests } = useChatRequests('PENDING');
  const { mutateAsync: acceptRequest, isPending: isAccepting } = useAcceptChatRequest();
  const { mutateAsync: rejectRequest, isPending: isRejecting } = useRejectChatRequest();

  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(60);

  // Socket setup & Presence/Request listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Send presence online event
    socket.emit('presence:online');

    const onIncomingRequest = (payload: any) => {
      setIncomingRequest(payload);
      setCountdown(60);
      refetchRequests();
    };

    const onRequestCancelled = (payload: any) => {
      if (incomingRequest && (payload.requestId === incomingRequest.requestId || payload.requestId === incomingRequest._id)) {
        setIncomingRequest(null);
        Alert.alert('Request Cancelled', 'The user cancelled the chat request.');
      }
      refetchRequests();
    };

    const onRequestExpired = (payload: any) => {
      if (incomingRequest && (payload.requestId === incomingRequest.requestId || payload.requestId === incomingRequest._id)) {
        setIncomingRequest(null);
      }
      refetchRequests();
    };

    socket.on('chat_request:receive', onIncomingRequest);
    socket.on('chat_request:new', onIncomingRequest);
    socket.on('chat_request:cancelled', onRequestCancelled);
    socket.on('chat_request:expired', onRequestExpired);

    return () => {
      socket.off('chat_request:receive', onIncomingRequest);
      socket.off('chat_request:new', onIncomingRequest);
      socket.off('chat_request:cancelled', onRequestCancelled);
      socket.off('chat_request:expired', onRequestExpired);
    };
  }, [socket, isConnected, incomingRequest]);

  // Handle local 60s countdown for incoming request modal
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (incomingRequest && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && incomingRequest) {
      setIncomingRequest(null);
    }
    return () => clearInterval(timer);
  }, [incomingRequest, countdown]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleAccept = async (requestId: string) => {
    try {
      const res = await acceptRequest(requestId);
      setIncomingRequest(null);
      if (res && res.chat) {
        router.push(`/chat/${res.chat._id || res.chat.id}`);
      } else {
        refetchRequests();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
      setIncomingRequest(null);
      refetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject request');
    }
  };

  const activeRequest = incomingRequest || (pendingRequests && pendingRequests.length > 0 ? pendingRequests[0] : null);
  const activeRequestId = activeRequest ? (activeRequest.requestId || activeRequest._id) : null;
  const senderInfo = activeRequest ? (activeRequest.sender || activeRequest.senderId) : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView contentContainerStyle={{ padding: 24 }}>

        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">ChatVerse</Text>
              <Text className="text-xs font-bold uppercase tracking-wider text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full">
                Creator Portal
              </Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Welcome back, {user?.name}!
            </Text>
          </View>

          <TouchableOpacity onPress={handleLogout} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <LogOut color={theme.colors.text.secondary.light} size={20} />
          </TouchableOpacity>
        </View>

        {/* Profile Summary Card */}
        <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-16 h-16 rounded-full bg-pink-500/10 items-center justify-center border-2 border-pink-500/30 overflow-hidden">
              <Image source={{ uri: getAvatarUrl(user?.avatar, user?.name, user?._id) }} className="w-full h-full" />
            </View>

            <View className="flex-1">
              <Text className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</Text>
              <View className="flex-row items-center gap-2 mt-2">
                <StatusBadge status="APPROVED" size="sm" />
                <View className="bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">ONLINE</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => router.push('/(app)/edit-profile')} 
              className="p-2 rounded-full bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800"
            >
              <Edit3 size={18} color="#e11d48" />
            </TouchableOpacity>
          </View>

          {user?.bio && (
            <Text className="text-slate-600 dark:text-slate-300 text-sm italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
              "{user.bio}"
            </Text>
          )}

          <TouchableOpacity
            onPress={() => router.push('/(app)/wallet')}
            className="w-full bg-rose-500 py-3 rounded-2xl flex-row items-center justify-center gap-2 shadow-md shadow-rose-500/20"
          >
            <Wallet size={18} color="#ffffff" />
            <Text className="text-white font-bold text-sm">Earnings & Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Incoming Chat Requests Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex-row items-center">
            Incoming Requests {pendingRequests && pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
          </Text>

          {activeRequest ? (
            <View className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 rounded-3xl shadow-lg border border-pink-400/30">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center border border-white/30 overflow-hidden">
                    <Image source={{ uri: getAvatarUrl(senderInfo?.avatar, senderInfo?.name, senderInfo?._id) }} className="w-full h-full" />
                  </View>
                  <View>
                    <Text className="text-white text-lg font-extrabold">{senderInfo?.name || 'User'}</Text>
                    <Text className="text-pink-100 text-xs font-medium">Wants to start a chat session</Text>
                  </View>
                </View>

                {/* Countdown timer badge */}
                <View className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                  <Text className="text-white font-extrabold text-sm">
                    {countdown}s
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => handleReject(activeRequestId)}
                  disabled={isRejecting || isAccepting}
                  className="flex-1 bg-white/20 py-3 rounded-2xl flex-row items-center justify-center border border-white/30"
                >
                  {isRejecting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <X color="#ffffff" size={18} className="mr-1" />
                      <Text className="text-white font-bold text-sm">Decline</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAccept(activeRequestId)}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 bg-white py-3 rounded-2xl flex-row items-center justify-center shadow-md"
                >
                  {isAccepting ? (
                    <ActivityIndicator color="#e11d48" size="small" />
                  ) : (
                    <>
                      <Check color="#e11d48" size={18} className="mr-1" />
                      <Text className="text-rose-600 font-extrabold text-sm">Accept & Chat</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 items-center justify-center">
              <PhoneCall color={theme.colors.text.secondary.light} size={32} className="mb-2" />
              <Text className="text-slate-800 dark:text-slate-200 font-bold text-base">
                No Pending Requests
              </Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-1">
                You are online and visible. When a boy sends a chat request, it will appear here in real time.
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Realtime Incoming Request Modal Alert */}
      <Modal visible={!!incomingRequest} transparent animationType="slide">
        <View className="flex-1 bg-black/60 items-center justify-end">
          <View className="bg-white dark:bg-slate-800 w-full p-6 rounded-t-3xl border-t border-slate-200 dark:border-slate-700 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-pink-500 animate-ping" />
                <Text className="text-xs font-extrabold uppercase tracking-wider text-pink-500">
                  New Incoming Chat Request
                </Text>
              </View>
              <View className="bg-pink-100 dark:bg-pink-900/40 px-3 py-1 rounded-full">
                <Text className="text-pink-600 dark:text-pink-300 font-bold text-xs">
                  {countdown}s remaining
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 mb-6">
              <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center overflow-hidden border-2 border-pink-500">
                <Image source={{ uri: getAvatarUrl(incomingRequest?.sender?.avatar, incomingRequest?.sender?.name, incomingRequest?.sender?._id) }} className="w-full h-full" />
              </View>

              <View className="flex-1">
                <Text className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {incomingRequest?.sender?.name || 'User'}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm">
                  Requested a chat session with you
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => handleReject(incomingRequest.requestId || incomingRequest._id)}
                disabled={isRejecting || isAccepting}
                className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-2xl items-center flex-row justify-center"
              >
                {isRejecting ? (
                  <ActivityIndicator color="#64748b" />
                ) : (
                  <>
                    <X color="#64748b" size={20} className="mr-1" />
                    <Text className="text-slate-700 dark:text-slate-300 font-bold text-base">Decline</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAccept(incomingRequest.requestId || incomingRequest._id)}
                disabled={isAccepting || isRejecting}
                className="flex-1 bg-pink-600 py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-pink-500/30"
              >
                {isAccepting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Check color="#ffffff" size={20} className="mr-1" />
                    <Text className="text-white font-bold text-base">Accept Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
