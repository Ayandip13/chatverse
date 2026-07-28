import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Wallet, Heart, User, ArrowLeft, Edit3, Shield, Info, LifeBuoy } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useProfile } from '../../src/hooks/useUser';
import { getAvatarUrl } from '../../src/utils/avatarUtil';

export default function ProfileScreen() {
  const router = useRouter();
  const authUser = useAuthStore(state => state.user);
  const { data: profile, isLoading } = useProfile();

  // Prefer fetched profile over local authStore for latest stats
  const user = profile || authUser;
  const avatarUri = getAvatarUrl(user?.avatar, user?.name, user?._id);

  const menuItems = [
    { title: 'My Wallet', icon: Wallet, route: '/wallet', color: '#10b981' },
    { title: 'Favorites', icon: Heart, route: '/favorites', color: '#ef4444' },
    { title: 'Settings', icon: Settings, route: '/settings', color: '#6366f1' },
    { title: 'Help & Support', icon: LifeBuoy, route: '/help', color: '#f59e0b' },
    { title: 'Privacy Policy', icon: Shield, route: '/legal?type=privacy', color: '#8b5cf6' },
    { title: 'About', icon: Info, route: '/legal?type=about', color: '#6b7280' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">Profile</Text>
        <TouchableOpacity onPress={() => router.push('/edit-profile')}>
          <Edit3 size={20} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="items-center px-6 pt-6 pb-8 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
          <View className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-4 border-indigo-50 dark:border-indigo-900/30">
            <Image source={{ uri: avatarUri }} className="w-full h-full" />
          </View>
          
          {isLoading ? (
            <ActivityIndicator color="#4f46e5" />
          ) : (
            <>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</Text>
              <Text className="text-gray-500 dark:text-gray-400 mt-1">{user?.email}</Text>
              <Text className="text-gray-600 dark:text-gray-300 text-center mt-4 px-4 leading-relaxed">
                {user?.bio || 'Add a bio to let others know you better.'}
              </Text>
            </>
          )}
        </View>

        {/* Menu Items */}
        <View className="px-4 py-6">
          <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-gray-700">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity 
                  key={item.title}
                  onPress={() => router.push(item.route as any)}
                  className={`flex-row items-center px-4 py-4 bg-white dark:bg-gray-800 ${
                    index < menuItems.length - 1 ? 'border-b border-gray-50 dark:border-gray-700/50' : ''
                  }`}
                >
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${item.color}15` }}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <Text className="flex-1 text-base font-semibold text-gray-800 dark:text-gray-200">
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
