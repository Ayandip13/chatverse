import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChatSummary } from '../../api/homeApi';
import { formatRelativeTime } from '../../utils/date';
import { getAvatarUrl } from '../../utils/avatarUtil';

export function RecentChatCard({ chat }: { chat: ChatSummary }) {
  const navigation = useNavigation<any>();
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ChatScreen', { id: chat._id })}
      className="mr-4 w-60 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-gray-700 flex-row items-center"
    >
      <View className="relative w-12 h-12 rounded-full mr-3">
        <Image 
          source={{ uri: getAvatarUrl(chat.otherParticipant?.avatar, chat.otherParticipant?.name, chat.otherParticipant?._id) }} 
          className="w-full h-full rounded-full"
        />
        {chat.otherParticipant.isOnline && (
          <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-bold text-gray-900 dark:text-white text-sm flex-1" numberOfLines={1}>
            {chat.otherParticipant.name}
          </Text>
          <Text className="text-[10px] text-gray-400">
            {chat.lastMessage?.createdAt ? formatRelativeTime(chat.lastMessage.createdAt) : ''}
          </Text>
        </View>
        <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
          {chat.lastMessage?.content || 'No messages yet'}
        </Text>
      </View>
      {chat.unreadCount > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center border-2 border-white dark:border-gray-800">
          <Text className="text-white text-[10px] font-bold">{chat.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
