import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { cn } from '../../utils/cn';
import { theme } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, containerClassName, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View className={cn('w-full mb-4', containerClassName)}>
        {label && (
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </Text>
        )}
        <View
          className={cn(
            'flex-row items-center bg-gray-50 dark:bg-gray-900 border rounded-xl px-3 h-12',
            isFocused ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700',
            error && 'border-red-500',
            className
          )}
        >
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className="flex-1 text-base text-gray-900 dark:text-gray-100"
            placeholderTextColor={theme.colors.text.muted.light}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
        {error && (
          <Text className="text-xs text-red-500 mt-1 font-medium">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
