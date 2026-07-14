import { View, Text, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function SearchBar() {
  const router = useRouter();

  return (
    <View className="px-6 mb-6">
      <TouchableOpacity 
        onPress={() => router.push('/search')}
        className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
      >
        <Search size={20} color="#9ca3af" className="mr-3" />
        <Text className="flex-1 text-gray-400 dark:text-gray-500 text-base">Search for girls, hobbies...</Text>
        <View className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg items-center justify-center shadow-sm">
          <SlidersHorizontal size={16} color="#4f46e5" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
