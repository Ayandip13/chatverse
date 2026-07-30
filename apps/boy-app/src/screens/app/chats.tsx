import { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useChats } from '../../hooks/useMessaging';
import { RecentChatCard } from '../../components/home/RecentChatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

export default function ChatsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const { data: chats, isLoading, refetch, isRefetching } = useChats();

  const filteredChats = chats?.filter(c => 
    c.otherParticipant.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <View className="px-6 py-6 pt-10">
        <Text className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Messages</Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-1">Connect with your favorite creators</Text>
      </View>

      <View className="px-6 pb-4">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 h-12 border border-gray-200 dark:border-gray-700">
          <Search size={20} color="#9ca3af" className="mr-2" />
          <TextInput
            className="flex-1 text-gray-900 dark:text-white"
            placeholder="Search conversations..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="px-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="flex-row items-center p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
              <Skeleton className="w-14 h-14 rounded-full mr-4" />
              <View className="flex-1">
                <View className="flex-row justify-between mb-2">
                  <Skeleton className="w-24 h-4 rounded-md" />
                  <Skeleton className="w-12 h-3 rounded-md" />
                </View>
                <Skeleton className="w-48 h-3 rounded-md" />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredChats || []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View className="mb-4">
              <RecentChatCard chat={item} />
            </View>
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState 
              icon={<MessageCircle size={48} color="#9ca3af" />}
              title="No messages yet" 
              description="Start a chat with someone to see it here." 
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
