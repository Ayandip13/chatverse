import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MessageCircle, User, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../../store/themeStore';

interface TabItemProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  IconComponent: any;
  isDark: boolean;
}

function TabItem({
  label,
  isFocused,
  onPress,
  onLongPress,
  IconComponent,
  isDark,
}: TabItemProps) {
  const iconScale = useRef(new Animated.Value(isFocused ? 1.15 : 1)).current;
  const iconTranslateY = useRef(new Animated.Value(isFocused ? -2 : 0)).current;
  const labelOpacity = useRef(new Animated.Value(isFocused ? 1 : 0.65)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: isFocused ? 1.15 : 0.95,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(iconTranslateY, {
        toValue: isFocused ? -2 : 0,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        toValue: isFocused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused, iconScale, iconTranslateY, labelOpacity]);

  const activeColor = '#ffffff';
  const inactiveColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-1 items-center justify-center py-2 z-10"
      activeOpacity={0.8}
    >
      <View className="items-center justify-center flex-row">
        <Animated.View
          style={{
            transform: [
              { scale: iconScale },
              { translateY: iconTranslateY }
            ],
          }}
        >
          <IconComponent
            color={isFocused ? activeColor : inactiveColor}
            size={20}
            strokeWidth={isFocused ? 2.5 : 2}
          />
        </Animated.View>

        {isFocused && (
          <Animated.View style={{ opacity: labelOpacity }}>
            <Text
              className="ml-2 font-black text-xs text-white tracking-wide"
              numberOfLines={1}
            >
              {label}
            </Text>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const [containerWidth, setContainerWidth] = useState(0);

  const bottomMargin =
    insets.bottom > 0
      ? insets.bottom + (Platform.OS === 'android' ? 8 : 4)
      : Platform.OS === 'ios'
        ? 24
        : 16;

  const getIcon = (routeName: string) => {
    switch (routeName) {
      case 'HomeTab': return Home;
      case 'ChatsTab': return MessageCircle;
      case 'ProfileTab': return User;
      default: return Sparkles;
    }
  };

  const getLabel = (routeName: string) => {
    switch (routeName) {
      case 'HomeTab': return 'Home';
      case 'ChatsTab': return 'Chats';
      case 'ProfileTab': return 'Profile';
      default: return routeName;
    }
  };

  // Sliding pill position spring animation
  const routeCount = state.routes.length || 3;
  const paddingHorizontal = 8; // padding inside glass container
  const tabWidth = containerWidth > 0 ? (containerWidth - paddingHorizontal * 2) / routeCount : 0;
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: state.index * tabWidth,
        friction: 7,
        tension: 110,
        useNativeDriver: true,
      }).start();
    }
  }, [state.index, tabWidth, slideAnim]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: bottomMargin,
        left: 16,
        right: 16,
        height: 64,
        borderRadius: 32,
        elevation: isDark ? 12 : 8,
        shadowColor: isDark ? '#000000' : '#4f46e5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.6 : 0.2,
        shadowRadius: 24,
      }}
    >
      {/* Background Glass Container */}
      <View
        onLayout={handleLayout}
        className={`w-full h-full flex-row items-center px-2 border ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/90'
            : 'bg-white/95 border-gray-200/90'
        } rounded-[32px] overflow-hidden relative`}
      >
        {/* iOS Glass Blur */}
        {Platform.OS === 'ios' && (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            intensity={85}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Sliding Active Pill Background */}
        {tabWidth > 0 && (
          <Animated.View
            style={{
              position: 'absolute',
              left: paddingHorizontal,
              width: tabWidth,
              height: 46,
              transform: [{ translateX: slideAnim }],
            }}
            className="px-1 items-center justify-center z-0"
          >
            <View className="w-full h-full bg-indigo-600 rounded-full border border-indigo-500 shadow-md shadow-indigo-600/50" />
          </Animated.View>
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : getLabel(route.name);

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              IconComponent={getIcon(route.name)}
              isDark={isDark}
            />
          );
        })}
      </View>
    </View>
  );
}