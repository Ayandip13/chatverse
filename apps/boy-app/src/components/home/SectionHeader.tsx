import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionText = 'See All', onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row justify-between items-center px-6 mb-4">
      <Text className="text-lg font-extrabold text-gray-900 dark:text-white">{title}</Text>
      {onAction && (
        <TouchableOpacity onPress={onAction} className="flex-row items-center">
          <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mr-1">{actionText}</Text>
          <ChevronRight size={16} color="#4f46e5" />
        </TouchableOpacity>
      )}
    </View>
  );
}
