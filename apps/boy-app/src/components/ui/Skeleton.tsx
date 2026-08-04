import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { cn } from "../../utils/cn";

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export const Skeleton = ({
  className,
  width,
  height,
  borderRadius = 8,
}: SkeletonProps) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 }),
      ),
      -1, // infinite
      true, // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width: width as any, height: height as any, borderRadius },
        animatedStyle,
      ]}
      className={cn("bg-gray-300 dark:bg-gray-700", className)}
    />
  );
};
