import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  LogOut, 
  Trash2, 
  Moon, 
  Bell, 
  ChevronRight, 
  Globe, 
  Lock, 
  Shield 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useDeleteAccount } from '../../hooks/useUser';
import { CustomModal } from '../../components/ui/CustomModal';
import { useRef, useState } from 'react';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const logout = useAuthStore(state => state.logout);
  const { mutate: deleteAccount } = useDeleteAccount();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'danger' | 'info' | 'success';
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  const [tapCount, setTapCount] = useState(0);
  const lastTapRef = useRef<number>(0);

  const handleVersionTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 2000) {
      const newCount = tapCount + 1;
      if (newCount >= 7) {
        setTapCount(0);
        navigation.navigate('DevSettings');
      } else {
        setTapCount(newCount);
      }
    } else {
      setTapCount(1);
    }
    lastTapRef.current = now;
  };

  const handleLogout = () => {
    setModalConfig({
      title: 'Logout',
      message: 'Are you sure you want to log out from your account?',
      type: 'danger',
      confirmText: 'Logout',
      onConfirm: async () => {
        setModalVisible(false);
        await logout();
        navigation.replace('Auth');
      }
    });
    setModalVisible(true);
  };

  const handleDeleteAccount = () => {
    setModalConfig({
      title: 'Delete Account',
      message: 'This action is irreversible. All your data, wallet coins, and message history will be permanently deleted.',
      type: 'danger',
      confirmText: 'Delete Permanently',
      onConfirm: () => {
        deleteAccount(undefined, {
          onSuccess: async () => {
            setModalVisible(false);
            await logout();
            navigation.replace('Auth');
          },
          onError: () => {
            setModalVisible(false);
            import('react-native').then(({ ToastAndroid }) => {
              ToastAndroid.show('Failed to delete account. Please try again.', ToastAndroid.SHORT);
            });
          }
        });
      }
    });
    setModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header Bar */}
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 mr-3" activeOpacity={0.7}>
          <View className="items-center justify-center">
            <ArrowLeft size={22} color="#6b7280" />
          </View>
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Settings</Text>
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-400">Account & Preferences</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Preferences Section */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2.5 px-1">
            Preferences
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm shadow-gray-200/60 dark:shadow-none border border-gray-100 dark:border-gray-700/80">
            {/* Dark Mode */}
            <View className="p-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700/60">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mr-3.5 border border-indigo-100 dark:border-indigo-900/40">
                  <Moon size={18} color="#6366f1" />
                </View>
                <View>
                  <Text className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Appearance</Text>
                  <Text className="text-xs font-medium text-gray-400">Theme mode</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-3 py-1 rounded-full">
                System Default
              </Text>
            </View>

            {/* Push Notifications */}
            <View className="p-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700/60">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 items-center justify-center mr-3.5 border border-amber-100 dark:border-amber-900/40">
                  <Bell size={18} color="#f59e0b" />
                </View>
                <View>
                  <Text className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Push Notifications</Text>
                  <Text className="text-xs font-medium text-gray-400">Call & chat alerts</Text>
                </View>
              </View>
              <View className="bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
                <Text className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Enabled</Text>
              </View>
            </View>

            {/* Language */}
            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center mr-3.5 border border-blue-100 dark:border-blue-900/40">
                  <Globe size={18} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Language</Text>
                  <Text className="text-xs font-medium text-gray-400">App interface language</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/60 px-3 py-1 rounded-full">
                English
              </Text>
            </View>
          </View>
        </View>

        {/* Security & Privacy Section */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2.5 px-1">
            Security & Privacy
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm shadow-gray-200/60 dark:shadow-none border border-gray-100 dark:border-gray-700/80">
            <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700/60" activeOpacity={0.7}>
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 items-center justify-center mr-3.5 border border-violet-100 dark:border-violet-900/40">
                  <Lock size={18} color="#8b5cf6" />
                </View>
                <View>
                  <Text className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Account Security</Text>
                  <Text className="text-xs font-medium text-gray-400">Password & login protection</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
              className="p-4 flex-row items-center justify-between" 
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 items-center justify-center mr-3.5 border border-rose-100 dark:border-rose-900/40">
                  <Shield size={18} color="#f43f5e" />
                </View>
                <View>
                  <Text className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Privacy & Terms</Text>
                  <Text className="text-xs font-medium text-gray-400">Data usage & policy</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Danger Actions Section */}
        <View className="mb-6 space-y-3">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
            Account Actions
          </Text>

          {/* Log Out */}
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-white dark:bg-gray-800 rounded-3xl p-4 flex-row items-center justify-between border border-gray-100 dark:border-gray-700/80 shadow-xs mb-3"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 items-center justify-center mr-3.5 border border-rose-100 dark:border-rose-900/40">
                <LogOut size={18} color="#ef4444" />
              </View>
              <View>
                <Text className="text-sm font-black text-rose-600 dark:text-rose-400">Log Out</Text>
                <Text className="text-xs font-medium text-gray-400">Sign out of this session</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#ef4444" />
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity 
            onPress={handleDeleteAccount}
            className="bg-rose-50 dark:bg-rose-950/30 rounded-3xl p-4 flex-row items-center justify-between border border-rose-200/60 dark:border-rose-900/40"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 items-center justify-center mr-3.5 border border-rose-200/80 dark:border-rose-800/40">
                <Trash2 size={18} color="#dc2626" />
              </View>
              <View>
                <Text className="text-sm font-black text-rose-700 dark:text-rose-400">Delete Account</Text>
                <Text className="text-xs font-medium text-rose-500/80 dark:text-rose-400/80">Permanently erase data & balance</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>

        {/* Developer Version Tap Trigger */}
        <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.7} className="items-center py-6">
          <Text className="text-xs text-gray-400 font-extrabold tracking-widest uppercase">ChatVerse v1.0.0</Text>
          {tapCount > 2 && (
            <Text className="text-[10px] text-indigo-500 font-bold mt-1">
              {7 - tapCount} tap{7 - tapCount === 1 ? '' : 's'} away from Developer Settings
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {modalConfig && (
        <CustomModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          confirmText={modalConfig.confirmText}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}
