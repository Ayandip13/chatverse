import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useChats } from '../../hooks/useMessaging';
import { RecentChatCard } from '../../components/home/RecentChatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

export default function ChatsScreen() {
  const navigation = useNavigation<any>();
  const { data: chats, isLoading, refetch, isRefetching } = useChats();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header Bar */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <View>
          <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Messages</Text>
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-400">Connect with your favorite creators</Text>
        </View>
        <View className="bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/40 flex-row items-center">
          <View className="mr-1.5 items-center justify-center">
            <MessageCircle size={14} color="#6366f1" />
          </View>
          <Text className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
            {chats?.length || 0} Chats
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="px-6 pt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="flex-row items-center p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 mb-3">
              <Skeleton className="w-12 h-12 rounded-full mr-3.5" />
              <View className="flex-1">
                <View className="flex-row justify-between mb-2">
                  <Skeleton className="w-24 h-4 rounded-md" />
                  <Skeleton className="w-12 h-3 rounded-md" />
                </View>
                <Skeleton className="w-44 h-3 rounded-md" />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={chats || []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View className="mb-3">
              <RecentChatCard chat={item} />
            </View>
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState 
              icon={<MessageCircle size={44} color="#9ca3af" />}
              title="No messages yet" 
              description="Start a chat with a creator to see your conversations here." 
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
