import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionText = 'See All', onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row justify-between items-center px-6 mb-3.5">
      <View className="flex-1 mr-2">
        <Text className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{title}</Text>
        {subtitle && (
          <Text className="text-xs text-gray-400 dark:text-gray-400 font-medium mt-0.5">{subtitle}</Text>
        )}
      </View>
      {onAction && (
        <TouchableOpacity 
          onPress={onAction} 
          className="flex-row items-center bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/40"
          activeOpacity={0.7}
        >
          <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-0.5">{actionText}</Text>
          <ChevronRight size={14} color="#6366f1" />
        </TouchableOpacity>
      )}
    </View>
  );
}
