import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export function HomeHeader() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-6 py-4">
      <View className="flex-row items-center space-x-3">
        <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500 items-center justify-center overflow-hidden">
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} className="w-full h-full" />
          ) : (
            <Text className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View>
          <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium">Good Evening, 👋</Text>
          <Text className="text-xl font-extrabold text-gray-900 dark:text-white">{user?.name}</Text>
        </View>
      </View>
      <View className="flex-row items-center space-x-4">
        <TouchableOpacity 
          onPress={() => router.push('/search')}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm"
        >
          <Search size={20} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/notifications')}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm relative"
        >
          <Bell size={20} color="#6b7280" />
          <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
