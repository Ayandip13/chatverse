import { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, CheckCheck, Circle, X, MessageSquare, CreditCard, UserCheck, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../hooks/useUser';
import { formatRelativeTime } from '../../utils/date';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Notification } from '../../api/userApi';

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
    let msg = item.body || item.message || 'No additional details provided.';
    if (msg.startsWith('[IMAGE]:')) {
      const payload = msg.replace('[IMAGE]:', '').trim();
      let caption = '';
      if (payload.includes('[CAPTION]:')) {
        caption = payload.split('[CAPTION]:')[1]?.trim() || '';
      } else if (payload.includes('\n')) {
        caption = payload.substring(payload.indexOf('\n') + 1).trim();
      }
      return caption ? `📷 ${caption}` : '📷 Sent a photo';
    }
    if (msg.startsWith('[VOICE')) {
      const match = /^\[VOICE(?::(\d+))?\]:/.exec(msg.trim());
      const duration = match && match[1] ? parseInt(match[1], 10) : 0;
      return duration > 0 ? `🎤 Voice message (${duration}s)` : '🎤 Sent a voice message';
    }
    if (msg.startsWith('[REPLY:')) {
      const endQuoteIdx = msg.indexOf(']:');
      if (endQuoteIdx !== -1) return `↩️ ${msg.substring(endQuoteIdx + 2)}`;
    }
    return msg;
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
    if (item.type === 'CHAT_REQUEST') {
      navigation.navigate('ChatRequests');
      return;
    }
    if (item.type === 'WALLET' || item.type === 'RECHARGE') {
      navigation.navigate('Wallet');
      return;
    }

    // Default action: Open full message viewer modal
    setSelectedNotification({
      ...item,
      body: messageText,
    });
  };

  const getNotificationIcon = (type: string, isRead: boolean) => {
    const color = isRead ? "#9ca3af" : "#4f46e5";
    switch (type) {
      case 'CHAT':
        return <MessageSquare size={20} color={color} />;
      case 'WALLET':
      case 'RECHARGE':
        return <CreditCard size={20} color={color} />;
      case 'VERIFICATION':
        return <UserCheck size={20} color={color} />;
      default:
        return <Bell size={20} color={color} />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">Notifications</Text>
        </View>
        
        {allNotifications.some(n => !isNotificationRead(n)) && (
          <TouchableOpacity 
            onPress={() => markAllRead()}
            className="flex-row items-center px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60"
          >
            <CheckCheck size={16} color="#4f46e5" className="mr-1" />
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="p-4 mb-3 rounded-2xl flex-row items-start border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
              <Skeleton className="w-8 h-8 rounded-full mr-3" />
              <View className="flex-1">
                <Skeleton className="w-32 h-4 rounded-md mb-2" />
                <Skeleton className="w-full h-3 rounded-md mb-1" />
                <Skeleton className="w-3/4 h-3 rounded-md mb-2" />
                <Skeleton className="w-16 h-2 rounded-md" />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={allNotifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isRead = isNotificationRead(item);
            const message = getNotificationMessage(item);

            return (
              <TouchableOpacity 
                onPress={() => handleNotificationClick(item)}
                activeOpacity={0.7}
                className={`p-4 mb-3 rounded-2xl flex-row items-start border ${
                  isRead 
                    ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' 
                    : 'bg-indigo-50/70 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800'
                }`}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  isRead ? 'bg-gray-100 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900/50'
                }`}>
                  {getNotificationIcon(item.type, isRead)}
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`font-bold text-base flex-1 mr-2 ${isRead ? 'text-gray-900 dark:text-white' : 'text-indigo-900 dark:text-indigo-100'}`}>
                      {item.title}
                    </Text>
                    {!isRead && <Circle size={8} fill="#4f46e5" color="#4f46e5" />}
                  </View>

                  <Text 
                    className="text-gray-600 dark:text-gray-300 text-sm mb-2 leading-snug"
                    numberOfLines={2}
                  >
                    {message}
                  </Text>

                  <Text className="text-xs font-medium text-gray-400">
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState 
              icon={<Bell size={48} color="#9ca3af" />}
              title="All caught up!" 
              description="You have no new notifications right now." 
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator size="small" color="#4f46e5" className="mt-4" /> : null
          }
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
            className="w-full bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center mr-3">
                  <Info size={20} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                    {selectedNotification?.title}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {selectedNotification ? formatRelativeTime(selectedNotification.createdAt) : ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setSelectedNotification(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center"
              >
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-base text-gray-700 dark:text-gray-200 leading-relaxed mb-6">
              {selectedNotification ? getNotificationMessage(selectedNotification) : ''}
            </Text>

            <TouchableOpacity
              onPress={() => setSelectedNotification(null)}
              className="w-full py-3.5 bg-indigo-600 rounded-xl items-center justify-center"
            >
              <Text className="text-white font-bold text-base">Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

