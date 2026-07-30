import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useChatRequests, useCancelChatRequest } from '../../hooks/useMessaging';
import { ChatRequestCard } from '../../components/chat/ChatRequestCard';
import { EmptyState } from '../../components/ui/EmptyState';

export default function ChatRequestsScreen() {
  const navigation = useNavigation<any>();
  
  // By default, fetch PENDING requests. For a full UI, you'd add a tab bar for "Pending", "Accepted", "Rejected"
  const { data: requests, isLoading, refetch, isRefetching } = useChatRequests('PENDING');
  const { mutate: cancelRequest } = useCancelChatRequest();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="flex-row items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">Pending Requests</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={requests || []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => (
            <ChatRequestCard 
              request={item} 
              onCancel={() => cancelRequest(item._id)} 
            />
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState 
              icon={<Clock size={48} color="#9ca3af" />}
              title="No pending requests" 
              description="When you request to chat with a girl, it will appear here until she accepts." 
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
