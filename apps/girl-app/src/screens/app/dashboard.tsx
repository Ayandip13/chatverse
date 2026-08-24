import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, ActivityIndicator, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import {
  LogOut, MessageCircle, Clock, Check, X,
  Edit3, Coins, Lock, TrendingUp, ArrowDownToLine,
  ChevronRight, ShieldCheck, MessageCircleHeart,
  Sparkles, Zap, Sun, Moon, Bell,
  Image as ImageIcon, Mic, Reply
} from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useSocket } from '../../providers/SocketProvider';
import { useAcceptChatRequest, useRejectChatRequest, useChatRequests, useRecentChats } from '../../hooks/useMessaging';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../store/themeStore';
import { useWithdrawalSummary } from '../../hooks/useWithdrawals';
import { useUnreadCount } from '../../hooks/useNotifications';
import { getAvatarUrl } from '../../utils/avatarUtil';
import { parseMessageContent } from '../../utils/messageUtil';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const appTheme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { data: unreadCount = 0 } = useUnreadCount();

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showTip, setShowTip] = useState<boolean>(true);

  // Queries
  const { data: summaryData } = useWithdrawalSummary();
  const { data: pendingRequests, refetch: refetchRequests } = useChatRequests('PENDING');
  const { data: recentChats, isLoading: isChatsLoading } = useRecentChats();

  const { mutateAsync: acceptRequest, isPending: isAccepting } = useAcceptChatRequest();
  const { mutateAsync: rejectRequest, isPending: isRejecting } = useRejectChatRequest();

  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(60);

  const [tapCount, setTapCount] = useState(0);
  const lastTapRef = useRef<number>(0);

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning, 👋';
    if (hours < 18) return 'Good Afternoon, 👋';
    return 'Good Evening, 👋';
  };

  const handleVersionTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 2000) {
      const newCount = tapCount + 1;
      if (newCount >= 7) {
        setTapCount(0);
        navigation.navigate('DevSettings');
      } else {
        setTapCount(newCount);
      }
    } else {
      setTapCount(1);
    }
    lastTapRef.current = now;
  };

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

    const onRequestAccepted = (payload: any) => {
      setIncomingRequest(null);
      queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      if (payload?.chatId) {
        navigation.navigate('ChatScreen', { id: payload.chatId });
      }
    };

    const onRequestCancelled = (payload: any) => {
      setIncomingRequest(null);
      refetchRequests();
      Alert.alert('Request Cancelled', 'The user cancelled the chat request.');
    };

    const onRequestExpired = (payload: any) => {
      setIncomingRequest(null);
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
    socket.on('chat_request:accepted', onRequestAccepted);
    socket.on('chat_request:cancelled', onRequestCancelled);
    socket.on('chat_request:expired', onRequestExpired);
    socket.on('wallet:update', onWalletUpdate);

    return () => {
      socket.off('chat_request:receive', onIncomingRequest);
      socket.off('chat_request:new', onIncomingRequest);
      socket.off('chat_request:accepted', onRequestAccepted);
      socket.off('chat_request:cancelled', onRequestCancelled);
      socket.off('chat_request:expired', onRequestExpired);
      socket.off('wallet:update', onWalletUpdate);
    };
  }, [socket, isConnected, isOnline, queryClient, refetchRequests]);

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
    navigation.replace('Login');
  };

  const handleAccept = async (requestId: string) => {
    setIncomingRequest(null);
    try {
      const res: any = await acceptRequest(requestId);
      queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      const chatId = res?.chat?._id || res?.chat?.id || res?.chatId || res?.data?.chat?._id || res?._id;
      if (chatId) {
        navigation.navigate('ChatScreen', { id: chatId });
      } else {
        refetchRequests();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Chat request accepted or updated';
      if (!msg.toLowerCase().includes('already')) {
        Alert.alert('Notice', msg);
      }
      refetchRequests();
    }
  };

  const handleReject = async (requestId: string) => {
    setIncomingRequest(null);
    try {
      await rejectRequest(requestId);
      queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
      refetchRequests();
    } catch (err: any) {
      Alert.alert('Notice', err.response?.data?.message || 'Chat request updated.');
      refetchRequests();
    }
  };

  const activeRequest = incomingRequest || (pendingRequests && pendingRequests.length > 0 ? pendingRequests[0] : null);
  const activeRequestId = activeRequest ? (activeRequest.requestId || activeRequest._id) : null;
  const senderInfo = activeRequest ? (activeRequest.sender || activeRequest.senderId) : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* --- 1. TOP NAVIGATION HEADER --- */}
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.8}>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">ChatVerse</Text>
              <View className="bg-pink-500/10 dark:bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                <Text className="text-[10px] font-extrabold uppercase text-pink-600 dark:text-pink-300">Creator Portal</Text>
              </View>
            </View>
            {tapCount > 2 && (
              <Text className="text-[10px] text-pink-500 font-bold mt-0.5">
                {7 - tapCount} tap{7 - tapCount === 1 ? '' : 's'} to Dev Tools
              </Text>
            )}
          </TouchableOpacity>

          {/* Right Header Buttons */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity 
              onPress={() => navigation.navigate('Notifications')} 
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm relative"
              activeOpacity={0.7}
            >
              <Bell size={18} color={appTheme === 'dark' ? '#cbd5e1' : '#475569'} />
              {unreadCount > 0 && (
                <View className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 rounded-full items-center justify-center border-2 border-white dark:border-slate-900">
                  <Text className="text-[9px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={toggleTheme} 
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm"
              activeOpacity={0.7}
            >
              {appTheme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#e11d48" />}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleLogout} 
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm"
              activeOpacity={0.7}
            >
              <LogOut size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- 2. CREATOR HERO & AVAILABILITY STATUS CARD --- */}
        <View className="bg-slate-900 dark:bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl mb-6 relative overflow-hidden">
          {/* Ambient Decorative Glow */}
          <View className="absolute -top-12 -right-12 w-36 h-36 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
          <View className="absolute -bottom-12 -left-12 w-36 h-36 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

          <View className="flex-row items-center justify-between mb-4 relative z-10">
            <View className="flex-row items-center gap-3">
              <View className="w-14 h-14 rounded-full p-0.5 border-2 border-pink-500/80 bg-slate-800 overflow-hidden shadow-lg">
                <Image source={{ uri: getAvatarUrl(user?.avatar, user?.name, user?._id) }} className="w-full h-full rounded-full" />
              </View>

              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-lg font-extrabold text-white tracking-tight">{user?.name}</Text>
                  <ShieldCheck size={18} color="#10b981" />
                </View>
                <Text className="text-slate-400 text-xs mt-0.5">{user?.email || 'Verified Creator'}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('EditProfile')}
              className="px-3 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/40 flex-row items-center gap-1.5"
              activeOpacity={0.8}
            >
              <Edit3 size={14} color="#f43f5e" />
              <Text className="text-xs font-bold text-pink-300">Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Availability Toggle Banner */}
          <View className={`p-4 rounded-2xl border transition-all duration-300 ${
            isOnline 
              ? 'bg-rose-950/40 border-rose-500/40' 
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <View className="relative">
                  <View className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                </View>

                <View>
                  <Text className="text-xs font-extrabold tracking-wide text-white uppercase">
                    {isOnline ? 'Active & Receiving Chats' : 'Status: Offline'}
                  </Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>
                    {isOnline ? 'You appear online to users searching for creators' : 'Switch online to start getting new chat requests'}
                  </Text>
                </View>
              </View>

              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#475569', true: '#f43f5e' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* --- 3. CREATOR GROWTH TIP BANNER (DISMISSIBLE) --- */}
        {showTip && (
          <View className="bg-pink-500/10 dark:bg-pink-500/15 p-4 rounded-2xl border border-pink-500/20 flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-pink-500/20 items-center justify-center border border-pink-500/30">
                <Zap size={18} color="#f43f5e" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900 dark:text-white">Earnings Boost Tip 💡</Text>
                <Text className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Staying online between 8 PM - 12 AM brings up to <Text className="font-extrabold text-pink-600 dark:text-pink-400">3x more chat requests</Text>!
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowTip(false)} className="p-1">
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}

        {/* --- 4. FINANCIAL KPI SUMMARY SECTION --- */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#f43f5e" />
              <Text className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Earnings Overview
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Wallet')}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-xs font-extrabold text-pink-600 dark:text-pink-400">Wallet Details</Text>
              <ChevronRight size={14} color="#f43f5e" />
            </TouchableOpacity>
          </View>

          {/* Hero Available Balance Card */}
          <View className="bg-rose-600 dark:bg-rose-700 p-5 rounded-3xl shadow-lg border border-rose-500/30 mb-3 relative overflow-hidden">
            <View className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full" />
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-rose-100 text-[11px] font-extrabold uppercase tracking-widest">Available Balance</Text>
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center border border-white/30">
                <Coins size={18} color="#ffffff" />
              </View>
            </View>
            <View className="flex-row items-baseline gap-1.5">
              <Text className="text-white text-3xl font-black font-mono tracking-tight">
                {(summaryData?.availableBalance || 0).toLocaleString()}
              </Text>
              <Text className="text-rose-200 text-xs font-bold uppercase">Coins</Text>
            </View>
          </View>

          {/* Secondary Financial KPI Grid */}
          <View className="flex-row gap-3 mb-3">
            {/* Total Lifetime Earnings */}
            <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Total Lifetime</Text>
                <TrendingUp size={16} color="#10b981" />
              </View>
              <Text className="text-slate-900 dark:text-white text-xl font-extrabold font-mono">
                ₹{(summaryData?.lifetimeEarnings || 0).toLocaleString()}
              </Text>
            </View>

            {/* Locked / Pending Balance */}
            <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Locked / Pending</Text>
                <Lock size={16} color="#f59e0b" />
              </View>
              <Text className="text-amber-600 dark:text-amber-400 text-xl font-extrabold font-mono">
                ₹{(summaryData?.lockedBalance || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Quick Payout Call-To-Action Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('WalletWithdraw')}
            className="bg-pink-500/10 dark:bg-pink-500/20 p-3.5 rounded-2xl border border-pink-500/30 flex-row items-center justify-center gap-2"
            activeOpacity={0.8}
          >
            <ArrowDownToLine size={18} color="#f43f5e" />
            <Text className="text-pink-600 dark:text-pink-300 font-extrabold text-xs">Request Quick Payout</Text>
          </TouchableOpacity>
        </View>

        {/* --- 5. INCOMING CHAT REQUESTS SECTION --- */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Incoming Chat Requests
            </Text>
            {pendingRequests && pendingRequests.length > 0 ? (
              <View className="bg-pink-500 px-2.5 py-0.5 rounded-full">
                <Text className="text-white text-[11px] font-extrabold">
                  {pendingRequests.length} Pending
                </Text>
              </View>
            ) : null}
          </View>

          {activeRequest ? (
            <View className="bg-pink-600 p-5 rounded-3xl shadow-xl border border-pink-400/30 relative">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center border-2 border-white/40 overflow-hidden shadow-sm">
                    <Image 
                      source={{ uri: getAvatarUrl(senderInfo?.avatar, senderInfo?.name, senderInfo?._id, 'BOY') }} 
                      className="w-full h-full rounded-full" 
                    />
                  </View>
                  <View>
                    <Text className="text-white text-base font-black tracking-tight">{senderInfo?.name || 'User'}</Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Text className="text-pink-100 text-xs font-semibold">Wants to chat</Text>
                      <View className="bg-white/20 px-2 py-0.5 rounded-full">
                        <Text className="text-white text-[10px] font-extrabold">+1 coin/msg</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Countdown Timer Badge */}
                <View className="bg-white/20 px-3 py-1.5 rounded-full border border-white/30 flex-row items-center gap-1">
                  <Clock size={12} color="#ffffff" />
                  <Text className="text-white font-black text-xs font-mono">
                    {countdown}s
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 pt-1">
                <TouchableOpacity
                  onPress={() => handleReject(activeRequestId)}
                  disabled={isRejecting || isAccepting}
                  className="flex-1 bg-white/20 py-3.5 rounded-2xl flex-row items-center justify-center border border-white/30"
                  activeOpacity={0.8}
                >
                  {isRejecting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <X color="#ffffff" size={18} className="mr-1.5" />
                      <Text className="text-white font-extrabold text-xs">Decline</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAccept(activeRequestId)}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 bg-white py-3.5 rounded-2xl flex-row items-center justify-center shadow-lg"
                  activeOpacity={0.9}
                >
                  {isAccepting ? (
                    <ActivityIndicator color="#e11d48" size="small" />
                  ) : (
                    <>
                      <Check color="#e11d48" size={18} className="mr-1.5" />
                      <Text className="text-rose-600 font-black text-xs">Accept & Chat</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 items-center justify-center text-center shadow-sm">
              <View className="w-12 h-12 rounded-2xl bg-pink-500/10 items-center justify-center mb-2.5">
                <MessageCircleHeart color="#f43f5e" size={26} />
              </View>
              <Text className="text-slate-900 dark:text-white font-extrabold text-sm">
                No Incoming Requests Right Now
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-1 leading-relaxed">
                When a user initiates a chat session with you, it will show up here in real time.
              </Text>
            </View>
          )}
        </View>

        {/* --- 6. RECENT CONVERSATIONS FEED --- */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Recent Conversations
            </Text>
            {recentChats && recentChats.length > 0 ? (
              <Text className="text-xs font-bold text-slate-400">
                {recentChats.length} Total
              </Text>
            ) : null}
          </View>

          {isChatsLoading ? (
            <ActivityIndicator color="#f43f5e" className="py-8" />
          ) : !recentChats || recentChats.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 items-center justify-center shadow-sm">
              <View className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mb-2.5">
                <MessageCircle color="#94a3b8" size={26} />
              </View>
              <Text className="text-slate-900 dark:text-white font-extrabold text-sm">No Conversations Yet</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-1">
                Your past and active chat sessions will be listed here.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {recentChats.map((chat: any) => {
                const otherUser = chat.otherParticipant || (typeof chat.boyId === 'object' ? chat.boyId : undefined);
                const isOtherOnline = otherUser?.isOnline;
                const isActive = chat.status === 'ACTIVE';
                const parsedMsg = parseMessageContent(chat.lastMessage?.content);
                const timeStr = chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <TouchableOpacity
                    key={chat._id}
                    onPress={() => navigation.navigate('ChatScreen', { id: chat._id })}
                    className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex-row items-center justify-between shadow-sm"
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center gap-3.5 flex-1 mr-2">
                      <View className="relative w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <Image 
                          source={{ uri: getAvatarUrl(otherUser?.avatar, otherUser?.name, otherUser?._id, 'BOY') }} 
                          className="w-full h-full rounded-full" 
                        />
                        {isOtherOnline && (
                          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                        )}
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-extrabold text-slate-900 dark:text-white" numberOfLines={1}>
                            {otherUser?.name || 'User'}
                          </Text>
                          {timeStr ? <Text className="text-[10px] text-slate-400 font-semibold">{timeStr}</Text> : null}
                        </View>

                        {parsedMsg.type === 'EMPTY' ? (
                          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 italic" numberOfLines={1}>
                            No messages yet
                          </Text>
                        ) : parsedMsg.type === 'IMAGE' ? (
                          <View className="flex-row items-center mt-0.5">
                            <View className="mr-1 items-center justify-center">
                              <ImageIcon size={13} color="#ec4899" />
                            </View>
                            <Text className="text-xs text-pink-600 dark:text-pink-400 font-semibold" numberOfLines={1}>
                              Photo
                            </Text>
                          </View>
                        ) : parsedMsg.type === 'VOICE' ? (
                          <View className="flex-row items-center mt-0.5">
                            <View className="mr-1 items-center justify-center">
                              <Mic size={13} color="#ec4899" />
                            </View>
                            <Text className="text-xs text-pink-600 dark:text-pink-400 font-semibold" numberOfLines={1}>
                              {parsedMsg.displayText}
                            </Text>
                          </View>
                        ) : parsedMsg.type === 'REPLY' ? (
                          <View className="flex-row items-center mt-0.5 flex-1">
                            <View className="mr-1 items-center justify-center">
                              <Reply size={13} color="#94a3b8" />
                            </View>
                            <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium flex-1" numberOfLines={1}>
                              {parsedMsg.displayText}
                            </Text>
                          </View>
                        ) : (
                          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
                            {parsedMsg.displayText}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center gap-1.5">
                      <View className={`px-2.5 py-1 rounded-full border ${
                        isActive 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}>
                        <Text className={`text-[10px] font-extrabold ${
                          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {isActive ? 'ACTIVE' : 'ENDED'}
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* --- 7. SECRET TAP & APP VERSION FOOTER --- */}
        <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.7} className="items-center py-6">
          <Text className="text-xs text-slate-400 font-bold tracking-widest uppercase">ChatVerse Host v1.0.0</Text>
          {tapCount > 2 && (
            <Text className="text-[10px] text-pink-500 font-extrabold mt-1">
              {7 - tapCount} tap{7 - tapCount === 1 ? '' : 's'} away from Developer Settings
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* --- 8. REALTIME INCOMING CHAT REQUEST MODAL --- */}
      <Modal 
        visible={!!incomingRequest} 
        transparent 
        animationType="slide"
        onRequestClose={() => setIncomingRequest(null)}
      >
        <View className="flex-1 bg-black/70 items-center justify-end">
          <View className="bg-white dark:bg-slate-900 w-full p-6 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-pink-500" />
                <Text className="text-xs font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
                  New Incoming Chat Request
                </Text>
              </View>
              <View className="bg-pink-500/10 dark:bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">
                <Text className="text-pink-600 dark:text-pink-300 font-extrabold text-xs font-mono">
                  {countdown}s remaining
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 mb-6">
              <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center overflow-hidden border-2 border-pink-500 shadow-md">
                <Image 
                  source={{ uri: getAvatarUrl(incomingRequest?.sender?.avatar, incomingRequest?.sender?.name, incomingRequest?.sender?._id, 'BOY') }} 
                  className="w-full h-full rounded-full" 
                />
              </View>

              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white text-xl font-black">{incomingRequest?.sender?.name || 'User'}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Wants to start a chat session with you</Text>
                <View className="flex-row items-center mt-2 bg-pink-500/10 dark:bg-pink-500/20 px-3 py-1 rounded-full self-start border border-pink-500/30">
                  <Text className="text-pink-600 dark:text-pink-400 text-xs font-extrabold">+1 coin/msg</Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => {
                  const reqId = incomingRequest?.requestId || incomingRequest?._id || activeRequestId;
                  if (reqId) handleReject(reqId);
                  else setIncomingRequest(null);
                }}
                disabled={isRejecting || isAccepting}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl items-center flex-row justify-center border border-slate-200 dark:border-slate-700"
              >
                {isRejecting ? (
                  <ActivityIndicator color="#64748b" />
                ) : (
                  <>
                    <X color="#64748b" size={20} className="mr-1.5" />
                    <Text className="text-slate-700 dark:text-slate-300 font-extrabold text-base">Decline</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const reqId = incomingRequest?.requestId || incomingRequest?._id || activeRequestId;
                  if (reqId) handleAccept(reqId);
                  else setIncomingRequest(null);
                }}
                disabled={isAccepting || isRejecting}
                className="flex-1 bg-pink-600 py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-pink-500/40"
              >
                {isAccepting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Check color="#ffffff" size={20} className="mr-1.5" />
                    <Text className="text-white font-black text-base">Accept Request</Text>
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
