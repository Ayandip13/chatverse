import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff } from 'lucide-react-native';

import apiClient from '../../src/api/apiClient';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/constants/theme';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>(); // Token usually comes from deep link
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) {
      Alert.alert('Error', 'Invalid or missing reset token.');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/auth/reset-password', { 
        token,
        newPassword: data.password 
      });
      
      Alert.alert(
        'Success', 
        'Your password has been successfully reset!',
        [{ text: 'Login', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password';
      Alert.alert('Reset Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900 px-6">
      <View className="mb-10 mt-8">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Create New Password</Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2">
          Your new password must be different from previous used passwords.
        </Text>
      </View>

      <View className="space-y-4">
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="New Password"
              placeholder="Enter new password"
              secureTextEntry={!showPassword}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
              leftIcon={<Lock color={theme.colors.text.muted.light} size={20} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  {showPassword ? (
                    <EyeOff color={theme.colors.text.muted.light} size={20} />
                  ) : (
                    <Eye color={theme.colors.text.muted.light} size={20} />
                  )}
                </TouchableOpacity>
              }
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm New Password"
              placeholder="Confirm new password"
              secureTextEntry={!showPassword}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.confirmPassword?.message}
              leftIcon={<Lock color={theme.colors.text.muted.light} size={20} />}
            />
          )}
        />
      </View>

      <Button
        onPress={handleSubmit(onSubmit)}
        isLoading={loading}
        className="w-full mt-8"
      >
        Reset Password
      </Button>

    </SafeAreaView>
  );
}
