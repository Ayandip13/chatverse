import React, { useEffect } from "react";
import { View, ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { cn } from "../../utils/cn";

export interface SkeletonProps extends ViewProps {
  className?: string;
}

export const Skeleton = ({ className, style, ...props }: SkeletonProps) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 750 }),
        withTiming(0.4, { duration: 750 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, style]}
      className={cn("bg-slate-200 dark:bg-slate-800 rounded-xl", className)}
      {...props}
    />
  );
};
