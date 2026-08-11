import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings, 
  Wallet, 
  Heart, 
  Edit3, 
  Shield, 
  Info, 
  LifeBuoy, 
  ChevronRight, 
  ShieldCheck, 
  LogOut, 
  Coins, 
  MessageCircle 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useUser';
import { useWalletSummary, useRecentChats } from '../../hooks/useHomeData';
import { useFavorites } from '../../hooks/useDiscovery';
import { getAvatarUrl } from '../../utils/avatarUtil';
import { Skeleton } from '../../components/ui/Skeleton';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const authUser = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { data: profile, isLoading } = useProfile();
  
  const { data: wallet } = useWalletSummary();
  const { data: favorites } = useFavorites();
  const { data: recentChats } = useRecentChats();

  // Prefer fetched profile over local authStore for latest stats
  const user = profile || authUser;
  const avatarUri = getAvatarUrl(user?.avatar, user?.name, user?._id);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  interface MenuItem {
    title: string;
    subtitle: string;
    icon: any;
    route: string;
    color: string;
    params?: Record<string, any>;
  }

  const accountMenu: MenuItem[] = [
    { title: 'My Wallet & Coins', subtitle: 'Manage balance & top up', icon: Wallet, route: 'Wallet', color: '#10b981' },
    { title: 'Favorites', subtitle: 'Saved creators list', icon: Heart, route: 'Favorites', color: '#ef4444' },
    { title: 'Settings', subtitle: 'App preferences & account', icon: Settings, route: 'Settings', color: '#6366f1' },
  ];

  const supportMenu: MenuItem[] = [
    { title: 'Help & Support', subtitle: 'Get help or FAQs', icon: LifeBuoy, route: 'Help', color: '#f59e0b' },
    { title: 'Privacy Policy', subtitle: 'Terms & privacy terms', icon: Shield, route: 'Legal', params: { type: 'privacy' }, color: '#8b5cf6' },
    { title: 'About ChatVerse', subtitle: 'App details & version', icon: Info, route: 'Legal', params: { type: 'about' }, color: '#6b7280' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Screen Header */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md">
        <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Profile</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditProfile')}
          className="flex-row items-center bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/40"
          activeOpacity={0.7}
        >
          <View className="mr-1.5 items-center justify-center">
            <Edit3 size={14} color="#6366f1" />
          </View>
          <Text className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* User Hero Card */}
        <View className="items-center p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-md shadow-gray-200/50 dark:shadow-none my-4">
          <View className="relative w-28 h-28 mb-4 p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400 shadow-md">
            <View className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900">
              <Image source={{ uri: avatarUri }} className="w-full h-full rounded-full" style={{ borderRadius: 9999 }} />
            </View>
          </View>
          
          {isLoading ? (
            <View className="items-center w-full">
              <Skeleton className="w-40 h-6 rounded-md mb-2" />
              <Skeleton className="w-32 h-4 rounded-md mb-4" />
              <Skeleton className="w-3/4 h-12 rounded-md" />
            </View>
          ) : (
            <>
              <View className="flex-row items-center mb-1">
                <Text className="text-2xl font-black text-gray-900 dark:text-white mr-1.5">{user?.name}</Text>
                <View className="items-center justify-center">
                  <ShieldCheck size={18} color="#3b82f6" />
                </View>
              </View>
              <Text className="text-xs font-semibold text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-3 py-1 rounded-full mb-3">
                {user?.email}
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-300 text-center leading-relaxed px-2 font-medium">
                {user?.bio || 'Add a bio to let others know you better.'}
              </Text>

              {/* Stats Dashboard Pills */}
              <View className="flex-row bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl p-4 border border-indigo-100/80 dark:border-indigo-900/40 justify-around w-full mt-5">
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Wallet')}
                  className="items-center flex-1"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center mb-1">
                    <View className="mr-1 items-center justify-center">
                      <Coins size={14} color="#f59e0b" fill="#fbbf24" />
                    </View>
                    <Text className="text-sm font-black text-gray-900 dark:text-white">
                      {wallet?.currentBalance?.toLocaleString() ?? 0}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Coins</Text>
                </TouchableOpacity>

                <View className="w-[1px] h-8 bg-indigo-200/50 dark:bg-indigo-800/50 self-center" />

                <TouchableOpacity 
                  onPress={() => navigation.navigate('Favorites')}
                  className="items-center flex-1"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center mb-1">
                    <View className="mr-1 items-center justify-center">
                      <Heart size={14} color="#ef4444" fill="#ef4444" />
                    </View>
                    <Text className="text-sm font-black text-gray-900 dark:text-white">
                      {favorites?.length ?? 0}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Favorites</Text>
                </TouchableOpacity>

                <View className="w-[1px] h-8 bg-indigo-200/50 dark:bg-indigo-800/50 self-center" />

                <TouchableOpacity 
                  onPress={() => navigation.navigate('Chats')}
                  className="items-center flex-1"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center mb-1">
                    <View className="mr-1 items-center justify-center">
                      <MessageCircle size={14} color="#6366f1" fill="#6366f1" />
                    </View>
                    <Text className="text-sm font-black text-gray-900 dark:text-white">
                      {recentChats?.length ?? 0}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chats</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Account Menu Section */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2.5 px-1">
            Account & Wallet
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm shadow-gray-200/60 dark:shadow-none border border-gray-100 dark:border-gray-700/80">
            {accountMenu.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity 
                  key={item.title}
                  onPress={() => navigation.navigate(item.route as any, item.params)}
                  className={`flex-row items-center p-4 bg-white dark:bg-gray-800 ${
                    index < accountMenu.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/60' : ''
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3.5" style={{ backgroundColor: `${item.color}15` }}>
                    <Icon size={18} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                      {item.title}
                    </Text>
                    <Text className="text-xs font-medium text-gray-400 dark:text-gray-400">
                      {item.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#9ca3af" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Support & Legal Menu Section */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2.5 px-1">
            Support & Legal
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm shadow-gray-200/60 dark:shadow-none border border-gray-100 dark:border-gray-700/80">
            {supportMenu.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity 
                  key={item.title}
                  onPress={() => navigation.navigate(item.route as any, item.params)}
                  className={`flex-row items-center p-4 bg-white dark:bg-gray-800 ${
                    index < supportMenu.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/60' : ''
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3.5" style={{ backgroundColor: `${item.color}15` }}>
                    <Icon size={18} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                      {item.title}
                    </Text>
                    <Text className="text-xs font-medium text-gray-400 dark:text-gray-400">
                      {item.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#9ca3af" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 py-4 rounded-3xl active:bg-rose-100"
          activeOpacity={0.8}
        >
          <View className="mr-2 items-center justify-center">
            <LogOut size={18} color="#ef4444" />
          </View>
          <Text className="text-rose-600 dark:text-rose-400 font-black text-sm tracking-wide">
            Log Out Account
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
