import { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useChats } from '../../src/hooks/useMessaging';
import { RecentChatCard } from '../../src/components/home/RecentChatCard';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function ChatsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: chats, isLoading, refetch, isRefetching } = useChats();

  const filteredChats = chats?.filter(c => 
    c.otherParticipant.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">Messages</Text>
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
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filteredChats || []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
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
