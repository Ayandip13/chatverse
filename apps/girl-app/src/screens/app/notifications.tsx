import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, CheckCheck, Circle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications';
import { Notification } from '../../api/notificationApi';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  
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

  const handleMarkRead = (item: Notification) => {
    if (!item.isRead) {
      markRead(item._id);
    }
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
        
        {allNotifications.some(n => !n.isRead) && (
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
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleMarkRead(item)}
              activeOpacity={0.8}
              className={`p-4 mb-3 rounded-2xl border flex-row items-start ${
                item.isRead 
                  ? 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800' 
                  : 'bg-pink-50/70 dark:bg-slate-900 border-pink-200 dark:border-pink-900/60'
              }`}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                item.isRead ? 'bg-slate-100 dark:bg-slate-800' : 'bg-pink-100 dark:bg-pink-950/80'
              }`}>
                <Bell size={18} color={item.isRead ? '#94a3b8' : '#ec4899'} />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className={`text-sm font-black ${
                    item.isRead ? 'text-slate-900 dark:text-white' : 'text-pink-600 dark:text-pink-400'
                  }`}>
                    {item.title}
                  </Text>
                  <Text className="text-[10px] font-semibold text-slate-400">
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.message}
                </Text>
              </View>

              {!item.isRead && (
                <View className="ml-2 mt-1">
                  <Circle size={8} color="#ec4899" fill="#ec4899" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
