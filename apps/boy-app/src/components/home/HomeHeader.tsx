import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { useUnreadCount } from '../../hooks/useUser';
import { getAvatarUrl } from '../../utils/avatarUtil';

export function HomeHeader() {
  const user = useAuthStore((state) => state.user);
  const navigation = useNavigation<any>();
  const { data: unreadCount = 0 } = useUnreadCount();

  const avatarUri = getAvatarUrl(user?.avatar, user?.name, user?._id);

  return (
    <View className="flex-row items-center justify-between px-6 py-4">
      <View className="flex-row items-center space-x-3">
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')}
          className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500 items-center justify-center overflow-hidden"
        >
          <Image source={{ uri: avatarUri }} className="w-full h-full" />
        </TouchableOpacity>
        <View>
          <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium">Good Evening, 👋</Text>
          <Text className="text-xl font-extrabold text-gray-900 dark:text-white">{user?.name}</Text>
        </View>
      </View>
      <View className="flex-row items-center space-x-4">
        <TouchableOpacity 
          onPress={() => navigation.navigate('Search')}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm"
        >
          <Search size={20} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm relative"
        >
          <Bell size={20} color="#6b7280" />
          {unreadCount > 0 && (
            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
