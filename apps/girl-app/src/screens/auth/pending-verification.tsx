import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Clock, PhoneCall, ShieldCheck, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

export default function PendingVerificationScreen() {
  const navigation = useNavigation<any>();
  const { user, checkAccountStatus, logout } = useAuthStore();
  const [checking, setChecking] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const updatedUser = await checkAccountStatus();
        // Navigation is handled automatically by RootNavigator based on user.status changes
      } catch (e) {
        // Silent catch for background polling
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleRefreshStatus = async () => {
    try {
      setChecking(true);
      const updatedUser = await checkAccountStatus();
      if (updatedUser) {
        if (updatedUser.status === 'APPROVED') {
          // Navigation is handled automatically by RootNavigator
        } else if (updatedUser.status === 'REJECTED') {
          // Navigation is handled automatically by RootNavigator
        } else if (updatedUser.status === 'SUSPENDED' || updatedUser.status === 'BANNED') {
          // Navigation is handled automatically by RootNavigator
        } else {
          Alert.alert('Status Updated', 'Your account is still pending phone verification by an administrator.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to check status. Please verify your network connection.');
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
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        refreshControl={
          <RefreshControl refreshing={checking} onRefresh={handleRefreshStatus} tintColor={theme.colors.primary} />
        }
      >
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-amber-500/10 rounded-full items-center justify-center mb-6 border-2 border-amber-500/30">
            <Clock color={theme.colors.warning} size={48} />
          </View>

          <StatusBadge status="PENDING" size="lg" className="mb-4" />

          <Text className="text-3xl font-extrabold text-slate-900 dark:text-white text-center tracking-tight">
            Account Pending Verification
          </Text>

          <Text className="text-slate-600 dark:text-slate-300 mt-3 text-center text-base leading-relaxed max-w-sm">
            Welcome, <Text className="font-bold text-slate-900 dark:text-white">{user?.name || 'Creator'}</Text>! Your profile has been created successfully.
          </Text>
        </View>

        {/* Informational Card */}
        <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 space-y-4">
          <View className="flex-row items-start gap-4">
            <View className="p-3 bg-amber-500/10 rounded-2xl">
              <PhoneCall color={theme.colors.warning} size={24} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900 dark:text-white text-base mb-1">
                Manual Phone Verification Required
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                To maintain high platform security and trust, an administrator will call your registered phone number (<Text className="font-semibold text-slate-700 dark:text-slate-200">{user?.phone || 'Provided Number'}</Text>) to complete verification.
              </Text>
            </View>
          </View>

          <View className="h-px bg-slate-100 dark:bg-slate-700 my-2" />

          <View className="flex-row items-center gap-3">
            <ShieldCheck color={theme.colors.success} size={20} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium flex-1">
              Once verified, your profile will become active and visible to Boys across the platform.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="space-y-3">
          <Button
            variant="primary"
            onPress={handleRefreshStatus}
            isLoading={checking}
            leftIcon={<RefreshCw color="white" size={18} />}
            className="w-full"
          >
            Check Verification Status
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
