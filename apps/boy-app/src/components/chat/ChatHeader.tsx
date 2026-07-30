import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ArrowLeft, MoreVertical, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ChatDetails } from '../../api/messagingApi';
import { getAvatarUrl } from '../../utils/avatarUtil';

export function ChatHeader({ chat, onRate }: { chat: ChatDetails, onRate?: () => void }) {
  const navigation = useNavigation<any>();

  return (
    <View className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <View className="flex-row items-center px-4 py-3 justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('GirlDetailScreen', { id: chat.otherParticipant._id })} className="flex-row items-center">
            <View className="relative w-10 h-10 rounded-full mr-3">
              <Image 
                source={{ uri: getAvatarUrl(chat.otherParticipant?.avatar, chat.otherParticipant?.name, chat.otherParticipant?._id) }} 
                className="w-full h-full rounded-full"
              />
              {chat.otherParticipant?.isOnline && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </View>
            <View>
              <Text className="font-bold text-gray-900 dark:text-white text-base">
                {chat.otherParticipant?.name || 'User'}
              </Text>
              <Text className="text-xs text-green-500 font-medium">
                {chat.otherParticipant?.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          {onRate && (
            <TouchableOpacity onPress={onRate} className="p-2 mr-1">
              <Star size={20} color="#fbbf24" />
            </TouchableOpacity>
          )}
          <TouchableOpacity className="p-2">
            <MoreVertical size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
