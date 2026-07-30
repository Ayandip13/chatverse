import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, RefreshCw, LogOut, AlertOctagon } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

export default function AccountSuspendedScreen() {
  const navigation = useNavigation<any>();
  const { user, checkAccountStatus, logout } = useAuthStore();
  const [checking, setChecking] = useState(false);

  const handleRefreshStatus = async () => {
    try {
      setChecking(true);
      const updatedUser = await checkAccountStatus();
      if (updatedUser) {
        if (updatedUser.status === 'APPROVED') {
          // Handled by RootNavigator
        } else {
          Alert.alert('Account Restricted', `Your account status is currently ${updatedUser.status}.`);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check status.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-rose-500/10 rounded-full items-center justify-center mb-6 border-2 border-rose-500/30">
            <ShieldAlert color={theme.colors.danger} size={48} />
          </View>

          <StatusBadge status={(user?.status as any) || 'SUSPENDED'} size="lg" className="mb-4" />

          <Text className="text-3xl font-extrabold text-slate-900 dark:text-white text-center tracking-tight">
            Account Suspended
          </Text>

          <Text className="text-slate-600 dark:text-slate-300 mt-3 text-center text-base leading-relaxed max-w-sm">
            Access for <Text className="font-bold text-slate-900 dark:text-white">{user?.name || 'User'}</Text> has been restricted due to platform moderation or policy review.
          </Text>
        </View>

        <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 space-y-3">
          <View className="flex-row items-center gap-3 mb-1">
            <AlertOctagon color={theme.colors.danger} size={20} />
            <Text className="font-bold text-slate-900 dark:text-white text-base">
              Suspension Details & Reason
            </Text>
          </View>

          <Text className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-medium">
            {user?.statusReason || 'Access restricted due to policy violation or manual administrative action.'}
          </Text>

          <Text className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
            While suspended, you cannot receive incoming chat requests, communicate with users, or withdraw earnings.
          </Text>
        </View>

        <View className="space-y-3">
          <Button
            variant="outline"
            onPress={handleRefreshStatus}
            isLoading={checking}
            leftIcon={<RefreshCw color={theme.colors.primary} size={18} />}
            className="w-full"
          >
            Check Status
          </Button>

          <Button
            variant="ghost"
            onPress={handleLogout}
            leftIcon={<LogOut color={theme.colors.primary} size={18} />}
            className="w-full"
          >
            Sign Out
          </Button>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
