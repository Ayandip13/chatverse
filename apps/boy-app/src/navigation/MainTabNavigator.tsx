import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "./types";
import { Home, MessageCircle, User } from "lucide-react-native";
import { BlurView } from "expo-blur";

import HomeScreen from "../screens/app/home";
import ChatsScreen from "../screens/app/chats";
import ProfileScreen from "../screens/app/profile";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#4f46e5", // Indigo-600
        tabBarInactiveTintColor: "#94a3b8", // Slate-400
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 24 : 16,
          left: 16,
          right: 16,
          elevation: 0,
          backgroundColor:
            Platform.OS === "ios" ? "transparent" : "rgba(255,255,255,0.95)",
          borderRadius: 24,
          height: 64,
          paddingBottom: Platform.OS === "ios" ? 0 : 8,
          paddingTop: 8,
          shadowColor: "#4f46e5",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          borderTopWidth: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              tint="light"
              intensity={80}
              style={StyleSheet.absoluteFill}
              className="rounded-3xl overflow-hidden"
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: -4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center p-2 rounded-full ${focused ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}`}
            >
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsScreen}
        options={{
          tabBarLabel: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center p-2 rounded-full ${focused ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}`}
            >
              <MessageCircle
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center p-2 rounded-full ${focused ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}`}
            >
              <User color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
