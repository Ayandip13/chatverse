import { View, Text, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export function SearchBar() {
  const navigation = useNavigation<any>();

  return (
    <View className="px-6 mb-6">
      <TouchableOpacity 
        onPress={() => navigation.navigate('Search')}
        className="flex-row items-center bg-white dark:bg-gray-800/90 rounded-2xl px-4 py-3 border border-gray-200/80 dark:border-gray-700/80 shadow-sm shadow-gray-200/50 dark:shadow-none"
        activeOpacity={0.8}
      >
        <View className="mr-3 items-center justify-center">
          <Search size={18} color="#9ca3af" />
        </View>
        <Text className="flex-1 text-gray-400 dark:text-gray-400 text-sm font-medium">Search creators, topics, hobbies...</Text>
        <View className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 rounded-xl items-center justify-center ml-2">
          <SlidersHorizontal size={14} color="#6366f1" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
