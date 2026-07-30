import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, ActivityIndicator, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import {
  LogOut, MessageCircle, Clock, Check, X,
  Edit3, Coins, Lock, TrendingUp, ArrowDownToLine,
  ChevronRight, ShieldCheck,
  MessageCircleHeart
} from 'lucide-react-native';
import { theme } from '../../src/constants/theme';
import { useRouter } from 'expo-router';
import { useSocket } from '../../src/providers/SocketProvider';
import { useAcceptChatRequest, useRejectChatRequest, useChatRequests, useRecentChats } from '../../src/hooks/useMessaging';
import { useQueryClient } from '@tanstack/react-query';
import { useWithdrawalSummary } from '../../src/hooks/useWithdrawals';
import { getAvatarUrl } from '../../src/utils/avatarUtil';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Queries
  const { data: summaryData, isLoading: isSummaryLoading } = useWithdrawalSummary();
  const { data: pendingRequests, refetch: refetchRequests, isLoading: isRequestsLoading } = useChatRequests('PENDING');
  const { data: recentChats, isLoading: isChatsLoading } = useRecentChats();

  const { mutateAsync: acceptRequest, isPending: isAccepting } = useAcceptChatRequest();
  const { mutateAsync: rejectRequest, isPending: isRejecting } = useRejectChatRequest();

  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(60);

  // Toggle Online/Offline status
  const handleToggleOnline = (value: boolean) => {
    setIsOnline(value);
    if (socket && isConnected) {
      if (value) {
        socket.emit('presence:online');
      } else {
        socket.emit('presence:offline');
      }
    }
  };

  // Socket setup & Presence/Request listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    if (isOnline) {
      socket.emit('presence:online');
    }

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

    const onWalletUpdate = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalSummary'] });
      queryClient.invalidateQueries({ queryKey: ['myWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['walletSummary'] });

      const newBal = payload?.newBalance !== undefined ? payload.newBalance : payload?.balance;
      if (newBal !== undefined) {
        queryClient.setQueryData(['withdrawalSummary'], (old: any) =>
          old ? { ...old, walletBalance: newBal, totalCoins: newBal } : old
        );
      }
    };

    socket.on('chat_request:receive', onIncomingRequest);
    socket.on('chat_request:new', onIncomingRequest);
    socket.on('chat_request:cancelled', onRequestCancelled);
    socket.on('chat_request:expired', onRequestExpired);
    socket.on('wallet:update', onWalletUpdate);

    return () => {
      socket.off('chat_request:receive', onIncomingRequest);
      socket.off('chat_request:new', onIncomingRequest);
      socket.off('chat_request:cancelled', onRequestCancelled);
      socket.off('chat_request:expired', onRequestExpired);
      socket.off('wallet:update', onWalletUpdate);
    };
  }, [socket, isConnected, incomingRequest, isOnline, queryClient]);

  // Handle local 60s countdown for incoming request modal
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
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
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">ChatVerse</Text>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                Creator Portal
              </Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Welcome back, {user?.name}!
            </Text>
          </View>

          <TouchableOpacity onPress={handleLogout} className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-800">
            <LogOut color={theme.colors.text.secondary.light} size={18} />
          </TouchableOpacity>
        </View>

        {/* Profile Summary & Availability Card */}
        <View className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-14 h-14 rounded-full bg-pink-500/10 items-center justify-center border-2 border-pink-500/30 overflow-hidden">
                <Image source={{ uri: getAvatarUrl(user?.avatar, user?.name, user?._id) }} className="w-full h-full" />
              </View>

              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</Text>
                  <ShieldCheck size={16} color="#10b981" />
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs">{user?.email}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(app)/edit-profile')}
              className="p-2.5 rounded-full bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800"
            >
              <Edit3 size={16} color="#e11d48" />
            </TouchableOpacity>
          </View>

          {/* Availability Toggle */}
          <View className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl flex-row items-center justify-between border border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <View className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Status: {isOnline ? 'ONLINE & VISIBLE' : 'OFFLINE'}
              </Text>
            </View>

            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#cbd5e1', true: '#f43f5e' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Financial KPI Summary Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-slate-900 dark:text-white">Earnings Overview</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/wallet')}>
              <Text className="text-xs font-bold text-pink-600 dark:text-pink-400">Manage Wallet</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mb-3">
            {/* Available Balance */}
            <View className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 p-4 rounded-2xl border border-rose-400/30">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-rose-800 text-[10px] font-bold uppercase tracking-wider">Available Balance</Text>
                <Coins size={16} color="#ffffff" />
              </View>
              <Text className="text-black text-2xl font-extrabold font-mono">
                ₹{(summaryData?.availableBalance || 0).toLocaleString()}
              </Text>
            </View>

            {/* Total Lifetime Earnings */}
            <View className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Earnings</Text>
                <TrendingUp size={16} color="#10b981" />
              </View>
              <Text className="text-slate-900 dark:text-white text-2xl font-extrabold font-mono">
                ₹{(summaryData?.lifetimeEarnings || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            {/* Pending Withdrawal */}
            <View className="flex-1 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] text-slate-400 font-semibold">Locked / Pending</Text>
                <Text className="text-base font-bold text-amber-600 font-mono">
                  ₹{(summaryData?.lockedBalance || 0).toLocaleString()}
                </Text>
              </View>
              <Lock size={16} color="#f59e0b" />
            </View>

            {/* Quick Withdraw CTA */}
            <TouchableOpacity
              onPress={() => router.push('/(app)/wallet/withdraw')}
              className="flex-1 bg-rose-50 dark:bg-rose-900/30 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-800 flex-row items-center justify-center gap-2"
            >
              <ArrowDownToLine size={16} color="#e11d48" />
              <Text className="text-rose-600 dark:text-rose-400 font-bold text-xs">Request Payout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Incoming Chat Requests Section */}
        <View className="mb-6">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Incoming Requests {pendingRequests && pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
          </Text>

          {activeRequest ? (
            <View className="bg-gradient-to-r from-pink-500 to-rose-500 p-5 rounded-3xl shadow-lg border border-pink-400/30">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center border border-white/30 overflow-hidden">
                    <Image source={{ uri: getAvatarUrl(senderInfo?.avatar, senderInfo?.name, senderInfo?._id) }} className="w-full h-full" />
                  </View>
                  <View>
                    <Text className="text-white text-base font-extrabold">{senderInfo?.name || 'User'}</Text>
                    <Text className="text-pink-100 text-xs font-medium">Chat session request (+8 coins/min)</Text>
                  </View>
                </View>

                {/* Countdown timer badge */}
                <View className="bg-white/20 px-2.5 py-1 rounded-full border border-white/30">
                  <Text className="text-white font-extrabold text-xs font-mono">
                    {countdown}s
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 pt-1">
                <TouchableOpacity
                  onPress={() => handleReject(activeRequestId)}
                  disabled={isRejecting || isAccepting}
                  className="flex-1 bg-white/20 py-3 rounded-2xl flex-row items-center justify-center border border-white/30"
                >
                  {isRejecting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <X color="#ffffff" size={16} className="mr-1" />
                      <Text className="text-white font-bold text-xs">Decline</Text>
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
                      <Check color="#e11d48" size={16} className="mr-1" />
                      <Text className="text-rose-600 font-extrabold text-xs">Accept & Chat</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 items-center justify-center">
              <MessageCircleHeart color={theme.colors.text.secondary.light} size={28} className="mb-2" />
              <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                No Pending Requests
              </Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-0.5">
                When a user requests a chat session, it will appear here in real time.
              </Text>
            </View>
          )}
        </View>

        {/* Recent Conversations Section */}
        <View className="mb-6">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Recent Conversations
          </Text>

          {isChatsLoading ? (
            <ActivityIndicator color="#e11d48" className="py-6" />
          ) : !recentChats || recentChats.length === 0 ? (
            <View className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 items-center justify-center">
              <MessageCircle color="#94a3b8" size={28} className="mb-2" />
              <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">No Recent Conversations</Text>
              <Text className="text-slate-400 text-xs text-center mt-0.5">
                All your past and active conversations will remain visible here.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {recentChats.map((chat: any) => {
                const otherUser = chat.otherParticipant || (typeof chat.boyId === 'object' ? chat.boyId : undefined);
                const isOnline = otherUser?.isOnline;
                const isActive = chat.status === 'ACTIVE';
                const lastMsg = chat.lastMessage?.content || 'No messages yet';
                const timeStr = chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <TouchableOpacity
                    key={chat._id}
                    onPress={() => router.push(`/chat/${chat._id}`)}
                    className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3 flex-1 mr-2">
                      <View className="relative w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        <Image source={{ uri: getAvatarUrl(otherUser?.avatar, otherUser?.name, otherUser?._id) }} className="w-full h-full rounded-full" />
                        {isOnline && (
                          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                        )}
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                            {otherUser?.name || 'User'}
                          </Text>
                          {timeStr ? <Text className="text-[10px] text-slate-400 font-medium">{timeStr}</Text> : null}
                        </View>
                        
                        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
                          {lastMsg}
                        </Text>
                      </View>
                    </View>

                    <View className={`px-2.5 py-1 rounded-full border ${
                      isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                    }`}>
                      <Text className={`text-[10px] font-bold ${
                        isActive ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-300'
                      }`}>
                        {isActive ? 'ACTIVE' : 'ENDED'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
                <View className="w-3 h-3 rounded-full bg-pink-500" />
                <Text className="text-xs font-extrabold uppercase tracking-wider text-pink-500">
                  New Incoming Chat Request
                </Text>
              </View>
              <View className="bg-pink-100 dark:bg-pink-900/40 px-3 py-1 rounded-full">
                <Text className="text-pink-600 dark:text-pink-300 font-bold text-xs font-mono">
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
                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  Requested a live chat session (+8 coins/min)
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
