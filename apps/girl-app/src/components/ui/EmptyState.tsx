import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => {
  return (
    <View className={cn('items-center justify-center p-6 my-8', className)}>
      {icon && <View className="mb-4 p-4 rounded-full bg-slate-100 dark:bg-slate-800">{icon}</View>}
      <Text className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs mb-6">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </View>
  );
};
