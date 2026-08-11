import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { useUnreadCount, useProfile } from '../../hooks/useUser';
import { getAvatarUrl } from '../../utils/avatarUtil';

export function HomeHeader() {
  const authUser = useAuthStore((state) => state.user);
  const { data: profile } = useProfile();
  const user = profile || authUser;
  
  const navigation = useNavigation<any>();
  const { data: unreadCount = 0 } = useUnreadCount();

  const avatarUri = getAvatarUrl(user?.avatar, user?.name, user?._id);

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning, 👋';
    if (hours < 18) return 'Good Afternoon, 👋';
    return 'Good Evening, 👋';
  };

  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md">
      {/* Left: Avatar & Greeting */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Profile')}
        className="flex-row items-center"
        activeOpacity={0.8}
      >
        <View className="relative w-12 h-12 rounded-full p-0.5 border-2 border-indigo-500 shadow-sm bg-white dark:bg-gray-800 mr-3.5 items-center justify-center">
          <View className="w-full h-full rounded-full overflow-hidden">
            <Image source={{ uri: avatarUri }} className="w-full h-full rounded-full" style={{ borderRadius: 9999 }} />
          </View>
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
        </View>
        <View className="justify-center">
          <Text className="text-gray-400 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">{getGreeting()}</Text>
          <Text className="text-lg font-black text-gray-900 dark:text-white tracking-tight" numberOfLines={1}>
            {user?.name || 'Explorer'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Right Actions: Notifications Icon Only */}
      <View className="flex-row items-center">
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center border border-gray-200/60 dark:border-gray-700/60 shadow-sm relative"
          activeOpacity={0.7}
        >
          <Bell size={18} color="#6b7280" />
          {unreadCount > 0 && (
            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-gray-800" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
