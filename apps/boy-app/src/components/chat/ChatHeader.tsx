import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ArrowLeft, MoreVertical, Star, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ChatDetails } from '../../api/messagingApi';
import { getAvatarUrl } from '../../utils/avatarUtil';

export function ChatHeader({ chat, onRate }: { chat: ChatDetails, onRate?: () => void }) {
  const navigation = useNavigation<any>();

  return (
    <View className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xs">
      <View className="flex-row items-center px-4 py-3 justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2 p-1.5 rounded-full active:bg-gray-100 dark:active:bg-gray-800">
            <View className="items-center justify-center">
              <ArrowLeft size={22} color="#374151" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('GirlDetailScreen', { id: chat.otherParticipant._id })} 
            className="flex-row items-center flex-1"
            activeOpacity={0.8}
          >
            <View className="relative w-12 h-12 rounded-full p-0.5 border-2 border-indigo-500 mr-3 items-center justify-center bg-gray-100 dark:bg-gray-800">
              <View className="w-full h-full rounded-full overflow-hidden">
                <Image 
                  source={{ uri: getAvatarUrl(chat.otherParticipant?.avatar, chat.otherParticipant?.name, chat.otherParticipant?._id) }} 
                  className="w-full h-full rounded-full"
                  style={{ borderRadius: 9999 }}
                />
              </View>
              {chat.otherParticipant?.isOnline && (
                <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="font-extrabold text-gray-900 dark:text-white text-base mr-1" numberOfLines={1}>
                  {chat.otherParticipant?.name || 'User'}
                </Text>
                <View className="items-center justify-center">
                  <ShieldCheck size={14} color="#3b82f6" />
                </View>
              </View>
              <Text className={`text-xs font-semibold ${chat.otherParticipant?.isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
                {chat.otherParticipant?.isOnline ? 'Active Now' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          {onRate && (
            <TouchableOpacity 
              onPress={onRate} 
              className="px-2.5 py-1.5 mr-2 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/40 flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="mr-1 items-center justify-center">
                <Star size={14} color="#f59e0b" fill="#fbbf24" />
              </View>
              <Text className="text-xs font-black text-amber-700 dark:text-amber-400">Rate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity className="p-1.5 rounded-full">
            <View className="items-center justify-center">
              <MoreVertical size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
