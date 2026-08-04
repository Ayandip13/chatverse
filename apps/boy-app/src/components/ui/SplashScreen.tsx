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
import { MessageCircle } from "lucide-react-native";
import { theme } from "../../constants/theme";

export const SplashScreen = () => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    opacity.value = withTiming(1, { duration: 800 });

    // Heartbeat animation for the logo
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
    <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center">
      <Animated.View
        style={animatedLogoStyle}
        className="w-24 h-24 bg-indigo-500 rounded-3xl items-center justify-center shadow-lg shadow-indigo-500/50 mb-6"
      >
        <MessageCircle color="white" size={48} />
      </Animated.View>

      <Animated.Text
        style={animatedTextStyle}
        className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight"
      >
        Chat<Text className="text-indigo-500">Verse</Text>
      </Animated.Text>

      <Animated.Text
        style={animatedTextStyle}
        className="text-gray-500 dark:text-gray-400 mt-2 font-medium"
      >
        Connect. Chat. Vibe.
      </Animated.Text>
    </View>
  );
};
