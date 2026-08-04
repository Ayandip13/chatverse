import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Heart, Sparkles } from "lucide-react-native";
import { theme } from "../../constants/theme";

export const SplashScreen = () => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center">
      <Animated.View
        style={animatedLogoStyle}
        className="w-28 h-28 bg-pink-500 rounded-3xl items-center justify-center mb-6 border border-white/20"
      >
        <Heart color="white" size={54} fill="white" />
      </Animated.View>

      <Animated.Text
        style={animatedTextStyle}
        className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
      >
        Chat<Text className="text-pink-500">Verse</Text>{" "}
        <Text className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
          Creator
        </Text>
      </Animated.Text>

      <Animated.Text
        style={animatedTextStyle}
        className="text-slate-500 dark:text-slate-400 mt-2 font-medium flex-row items-center"
      >
        Connect. Inspire. Earn.
      </Animated.Text>
    </View>
  );
};
