import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, LogOut, Trash2, Moon, Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useDeleteAccount } from '../../hooks/useUser';
import { CustomModal } from '../../components/ui/CustomModal';
import { useState } from 'react';

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

  const handleLogout = () => {
    setModalConfig({
      title: 'Logout',
      message: 'Are you sure you want to log out?',
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
      message: 'This action is irreversible. All your data, wallet balance, and chats will be permanently deleted.',
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
      <View className="px-6 py-6 pt-10">
        <Text className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Profile</Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Mock Profile Card */}
        <View className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 mb-6 shadow-lg shadow-indigo-500/30">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/50 items-center justify-center">
              <Text className="text-2xl font-bold text-white">👤</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white text-xl font-bold">Premium User</Text>
              <Text className="text-indigo-100 text-sm mt-0.5">Edit Profile</Text>
            </View>
          </View>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden mb-6 border border-gray-100 dark:border-gray-700 shadow-sm shadow-gray-200/50">
          <View className="px-4 py-4 flex-row items-center justify-between border-b border-gray-50 dark:border-gray-700/50">
            <View className="flex-row items-center">
              <Moon size={20} color="#6b7280" className="mr-4" />
              <Text className="text-base font-semibold text-gray-800 dark:text-gray-200">Dark Mode</Text>
            </View>
            <Text className="text-sm text-gray-400">System Default</Text>
          </View>
          
          <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Bell size={20} color="#6b7280" className="mr-4" />
              <Text className="text-base font-semibold text-gray-800 dark:text-gray-200">Push Notifications</Text>
            </View>
            <Text className="text-sm text-indigo-500 font-bold">Enabled</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-4 flex-row items-center mb-4 border border-gray-100 dark:border-gray-700"
        >
          <LogOut size={20} color="#ef4444" className="mr-4" />
          <Text className="text-base font-bold text-red-500">Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleDeleteAccount}
          className="bg-red-50 dark:bg-red-900/10 rounded-2xl px-4 py-4 flex-row items-center border border-red-100 dark:border-red-900/30"
        >
          <Trash2 size={20} color="#dc2626" className="mr-4" />
          <Text className="text-base font-bold text-red-600">Delete Account</Text>
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
