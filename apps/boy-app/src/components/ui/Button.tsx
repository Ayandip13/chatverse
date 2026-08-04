import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from "react-native";
import { cn } from "../../utils/cn";
import { theme } from "../../constants/theme";

export interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "flex-row items-center justify-center rounded-xl active:opacity-80";

  const variants = {
    primary: "bg-indigo-500",
    secondary: "bg-pink-500",
    outline: "border-2 border-indigo-500 bg-transparent",
    ghost: "bg-transparent active:bg-indigo-500/10",
    danger: "bg-red-500",
  };

  const sizes = {
    sm: "py-2 px-4",
    md: "py-3 px-6",
    lg: "py-4 px-8",
  };

  const textVariants = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-indigo-500",
    ghost: "text-indigo-500",
    danger: "text-white",
  };

  const textSizes = {
    sm: "text-sm font-semibold",
    md: "text-base font-bold",
    lg: "text-lg font-bold",
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        isDisabled && "opacity-50",
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? theme.colors.primary
              : "white"
          }
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text
            className={cn(
              textVariants[variant],
              textSizes[size],
              "text-center",
            )}
          >
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};
