import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { cn } from '../../utils/cn';
import { theme } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, isPassword, secureTextEntry, className, containerClassName, multiline, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const effectiveSecureTextEntry = isPassword ? !showPassword : secureTextEntry;

    const computedRightIcon = rightIcon || (isPassword ? (
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1" activeOpacity={0.7}>
        {showPassword ? (
          <EyeOff color={theme.colors.text.muted.light} size={20} />
        ) : (
          <Eye color={theme.colors.text.muted.light} size={20} />
        )}
      </TouchableOpacity>
    ) : null);

    return (
      <View className={cn('w-full mb-4', containerClassName)}>
        {label && (
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </Text>
        )}
        <View
          className={cn(
            'flex-row items-center bg-gray-50 dark:bg-gray-900 border rounded-2xl px-4',
            multiline ? 'py-3 min-h-[100px] items-start' : 'h-14 items-center',
            isFocused ? 'border-indigo-500 border-2' : 'border-gray-200 dark:border-gray-800',
            error && 'border-red-500',
            className
          )}
        >
          {leftIcon && <View className={cn('mr-3', multiline && 'mt-0.5')}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            className="flex-1 text-base text-gray-900 dark:text-gray-100"
            placeholderTextColor={theme.colors.text.muted.light}
            secureTextEntry={effectiveSecureTextEntry}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
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
          {computedRightIcon && <View className={cn('ml-3', multiline && 'mt-0.5')}>{computedRightIcon}</View>}
        </View>
        {error && (
          <Text className="text-xs text-red-500 mt-1.5 font-medium ml-1">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
