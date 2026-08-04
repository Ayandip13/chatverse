import React from "react";
import { View, Text } from "react-native";
import { cn } from "../../utils/cn";
import { theme } from "../../constants/theme";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <View className={cn("flex-1 items-center justify-center p-6", className)}>
      {icon && (
        <View className="mb-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
          {icon}
        </View>
      )}
      <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
        {title}
      </Text>
      {description && (
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs">
          {description}
        </Text>
      )}
      {action && <View>{action}</View>}
    </View>
  );
};
