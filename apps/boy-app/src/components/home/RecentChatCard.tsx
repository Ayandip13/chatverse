import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChatSummary } from '../../api/homeApi';
import { formatRelativeTime } from '../../utils/date';
import { getAvatarUrl } from '../../utils/avatarUtil';
import { ShieldCheck } from 'lucide-react-native';

export function RecentChatCard({ chat }: { chat: ChatSummary }) {
  const navigation = useNavigation<any>();
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ChatScreen', { id: chat._id })}
      className="w-full bg-white dark:bg-gray-800 rounded-2xl p-3.5 shadow-xs border border-gray-100 dark:border-gray-700/80 flex-row items-center justify-between"
      activeOpacity={0.8}
    >
      {/* 100% Round Circle Avatar with Online Dot */}
      <View className="relative w-12 h-12 rounded-full p-0.5 border-2 border-indigo-500 mr-3.5 items-center justify-center bg-gray-100 dark:bg-gray-800">
        <View className="w-full h-full rounded-full overflow-hidden">
          <Image 
            source={{ uri: getAvatarUrl(chat.otherParticipant?.avatar, chat.otherParticipant?.name, chat.otherParticipant?._id) }} 
            className="w-full h-full rounded-full"
            style={{ borderRadius: 9999 }}
          />
        </View>
        {chat.otherParticipant.isOnline && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </View>

      <View className="flex-1 mr-2">
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-row items-center flex-1 mr-2">
            <Text className="font-extrabold text-gray-900 dark:text-white text-base mr-1" numberOfLines={1}>
              {chat.otherParticipant.name}
            </Text>
            <View className="items-center justify-center">
              <ShieldCheck size={14} color="#3b82f6" />
            </View>
          </View>
          <Text className="text-[11px] font-medium text-gray-400">
            {chat.lastMessage?.createdAt ? formatRelativeTime(chat.lastMessage.createdAt) : ''}
          </Text>
        </View>
        <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium" numberOfLines={1}>
          {chat.lastMessage?.content || 'Tap to start conversation'}
        </Text>
      </View>

      {chat.unreadCount > 0 && (
        <View className="bg-indigo-600 px-2 py-0.5 rounded-full items-center justify-center min-w-[20px]">
          <Text className="text-white text-[10px] font-black">{chat.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
