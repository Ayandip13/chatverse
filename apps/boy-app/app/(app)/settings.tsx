import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, LogOut, Trash2, Moon, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useDeleteAccount } from '../../src/hooks/useUser';

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore(state => state.logout);
  const { mutate: deleteAccount } = useDeleteAccount();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        }
      }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account', 
      'This action is irreversible. All your data, wallet balance, and chats will be permanently deleted.', 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive',
          onPress: () => {
            deleteAccount(undefined, {
              onSuccess: async () => {
                await logout();
                router.replace('/');
              },
              onError: () => {
                Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
              }
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">Settings</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-6 border border-gray-100 dark:border-gray-700">
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
    </SafeAreaView>
  );
}
