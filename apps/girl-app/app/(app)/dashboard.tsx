import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { Button } from '../../src/components/ui/Button';
import { Heart, Sparkles, User, LogOut, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../../src/constants/theme';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView contentContainerStyle={{ padding: 24 }}>

        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">ChatVerse</Text>
              <Text className="text-xs font-bold uppercase tracking-wider text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full">
                Creator
              </Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Welcome back, {user?.name}!
            </Text>
          </View>

          <TouchableOpacity onPress={handleLogout} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <LogOut color={theme.colors.text.secondary.light} size={20} />
          </TouchableOpacity>
        </View>

        {/* Profile Summary Card */}
        <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-16 h-16 rounded-full bg-pink-500/10 items-center justify-center border-2 border-pink-500/30 overflow-hidden">
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} className="w-full h-full" />
              ) : (
                <User color={theme.colors.secondary} size={32} />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</Text>
              <StatusBadge status="APPROVED" size="sm" className="mt-2" />
            </View>
          </View>

          {user?.bio && (
            <Text className="text-slate-600 dark:text-slate-300 text-sm italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              "{user.bio}"
            </Text>
          )}
        </View>

        {/* Coming Soon Notice */}
        <View className="bg-pink-500/10 p-6 rounded-3xl border border-pink-500/20 items-center">
          <Sparkles color={theme.colors.secondary} size={36} className="mb-3" />
          <Text className="text-lg font-bold text-slate-900 dark:text-white text-center mb-1">
            Dashboard Foundation Active
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm text-center leading-relaxed">
            Incoming chat requests, earnings management, and real-time chat functionality will be active in subsequent modules.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
