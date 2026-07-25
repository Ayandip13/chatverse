import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { cn } from '../../utils/cn';
import { theme } from '../../constants/theme';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'flex-row items-center justify-center rounded-2xl active:opacity-80';

  const variants = {
    primary: 'bg-indigo-500 shadow-sm shadow-indigo-500/30',
    secondary: 'bg-pink-500 shadow-sm shadow-pink-500/30',
    outline: 'border-2 border-indigo-500 bg-transparent',
    ghost: 'bg-transparent active:bg-indigo-500/10',
    danger: 'bg-red-500 shadow-sm shadow-red-500/30',
  };

  const sizes = {
    sm: 'py-2.5 px-4 min-h-[40px]',
    md: 'py-3.5 px-6 min-h-[48px]',
    lg: 'py-4 px-8 min-h-[56px]',
  };

  const textVariants = {
    primary: 'text-white font-bold',
    secondary: 'text-white font-bold',
    outline: 'text-indigo-500 font-bold',
    ghost: 'text-indigo-500 font-bold',
    danger: 'text-white font-bold',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-50',
        className
      )}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : 'white'} />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={cn(textVariants[variant], textSizes[size], 'text-center')}>
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};
