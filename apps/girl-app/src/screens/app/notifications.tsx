import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, CheckCheck, Circle, X, Info, MessageSquare, Wallet } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications';
import { Notification } from '../../api/notificationApi';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    fetchNextPage, 
    hasNextPage,
    refetch,
    isRefetching
  } = useNotifications();

  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead } = useMarkAllRead();

  const allNotifications = data?.pages.flatMap(p => p.items) || [];

  const isNotificationRead = (item: Notification) => {
    return item.status === 'READ' || item.isRead === true;
  };

  const getNotificationMessage = (item: Notification) => {
    return item.body || item.message || 'No additional details provided.';
  };

  const handleNotificationClick = (item: Notification) => {
    if (!isNotificationRead(item)) {
      markRead(item._id);
    }

    const messageText = getNotificationMessage(item);

    // Contextual navigation if applicable
    if (item.type === 'CHAT' && item.actionUrl) {
      navigation.navigate('ChatScreen', { id: item.actionUrl });
      return;
    }
    if (item.type === 'WALLET' || item.type === 'WITHDRAWAL') {
      navigation.navigate('Wallet');
      return;
    }

    // Default action: Open full message viewer modal
    setSelectedNotification({
      ...item,
      body: messageText,
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="mr-3 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} className="text-slate-700 dark:text-slate-200" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-slate-900 dark:text-white">Notifications</Text>
        </View>
        
        {allNotifications.some(n => !isNotificationRead(n)) && (
          <TouchableOpacity 
            onPress={() => markAllRead()}
            className="bg-pink-50 dark:bg-pink-950/50 px-3 py-1.5 rounded-full border border-pink-200/60 dark:border-pink-900/40 flex-row items-center"
            activeOpacity={0.8}
          >
            <CheckCheck size={14} color="#ec4899" className="mr-1" />
            <Text className="text-xs font-bold text-pink-600 dark:text-pink-400">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="p-6 items-center justify-center flex-1">
          <ActivityIndicator size="large" color="#ec4899" />
          <Text className="text-sm font-semibold text-slate-400 mt-3">Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={allNotifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#ec4899" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-20 items-center justify-center px-6">
              <View className="w-16 h-16 rounded-full bg-pink-50 dark:bg-pink-950/60 items-center justify-center mb-4">
                <Bell size={28} color="#ec4899" />
              </View>
              <Text className="text-lg font-black text-slate-900 dark:text-white mb-1">No notifications yet</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
                We'll notify you here when you receive new messages, updates, or earnings.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isRead = isNotificationRead(item);
            const message = getNotificationMessage(item);

            return (
              <TouchableOpacity 
                onPress={() => handleNotificationClick(item)}
                activeOpacity={0.8}
                className={`p-4 mb-3 rounded-2xl border flex-row items-start ${
                  isRead 
                    ? 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800' 
                    : 'bg-pink-50/70 dark:bg-slate-900 border-pink-200 dark:border-pink-900/60'
                }`}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  isRead ? 'bg-slate-100 dark:bg-slate-800' : 'bg-pink-100 dark:bg-pink-950/80'
                }`}>
                  <Bell size={18} color={isRead ? '#94a3b8' : '#ec4899'} />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`text-sm font-black ${
                      isRead ? 'text-slate-900 dark:text-white' : 'text-pink-600 dark:text-pink-400'
                    }`}>
                      {item.title}
                    </Text>
                    <Text className="text-[10px] font-semibold text-slate-400">
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <Text 
                    className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed"
                    numberOfLines={2}
                  >
                    {message}
                  </Text>
                </View>

                {!isRead && (
                  <View className="ml-2 mt-1">
                    <Circle size={8} color="#ec4899" fill="#ec4899" />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Notification Message Detail Modal */}
      <Modal
        visible={!!selectedNotification}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <Pressable 
          className="flex-1 bg-black/60 justify-center items-center p-6"
          onPress={() => setSelectedNotification(null)}
        >
          <Pressable 
            className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-950/80 items-center justify-center mr-3">
                  <Info size={20} color="#ec4899" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-black text-slate-900 dark:text-white" numberOfLines={1}>
                    {selectedNotification?.title}
                  </Text>
                  <Text className="text-xs font-semibold text-slate-400">
                    {selectedNotification ? formatDate(selectedNotification.createdAt) : ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setSelectedNotification(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed mb-6">
              {selectedNotification ? getNotificationMessage(selectedNotification) : ''}
            </Text>

            <TouchableOpacity
              onPress={() => setSelectedNotification(null)}
              className="w-full py-3.5 bg-pink-500 rounded-xl items-center justify-center shadow-sm"
            >
              <Text className="text-white font-extrabold text-base">Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

