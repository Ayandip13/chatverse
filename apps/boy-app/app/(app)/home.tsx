import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/authStore';

export default function HomeScreen() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center items-center px-6">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Home Screen</Text>
      <Text className="text-gray-500 dark:text-gray-400 mb-8 text-center">
        Welcome {user?.name}! This is the placeholder for the main application feed.
      </Text>
      
      <Button onPress={logout} variant="outline" className="w-full max-w-xs">
        Log Out
      </Button>
    </SafeAreaView>
  );
}
