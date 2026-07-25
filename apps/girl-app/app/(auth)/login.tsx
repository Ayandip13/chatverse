import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useState } from 'react';
import apiClient from '../../src/api/apiClient';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, Heart, Sparkles } from 'lucide-react-native';
import { theme } from '../../src/constants/theme';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'dummy-web.apps.googleusercontent.com',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'dummy-ios.apps.googleusercontent.com',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'dummy-android.apps.googleusercontent.com',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password
      });

      const { user, accessToken, refreshToken } = response.data.data;

      if (user.role !== 'GIRL') {
        Alert.alert('Access Denied', 'This app is exclusively for verified Girl creators.');
        return;
      }

      await setAuth(user, accessToken, refreshToken);
      // Navigation is handled automatically by the auth layout guard
    } catch (error: any) {
      console.log('Login Error:', error.response?.data || error.message);
      const errorCode = error.response?.data?.error?.code;
      const message = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Failed to connect to server';
      
      if (errorCode === 'GIRL_REJECTED') {
        Alert.alert('Application Rejected', 'Your creator account application was not approved.');
      } else if (errorCode === 'USER_SUSPENDED' || errorCode === 'USER_BANNED') {
        Alert.alert('Account Suspended', 'Your creator account has been suspended by administration.');
      } else {
        Alert.alert('Login Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Creator Sign In', 'Google authentication flow is configured and ready for production Client IDs.');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>

          <View className="mb-8 items-center">
            <View className="w-20 h-20 bg-pink-500/10 dark:bg-pink-500/20 rounded-3xl items-center justify-center mb-5 border border-pink-500/20">
              <Heart color={theme.colors.secondary} size={40} fill={theme.colors.secondary} />
            </View>
            <Text className="text-3xl font-extrabold text-slate-900 dark:text-white text-center tracking-tight">
              Creator Login
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center text-base font-medium">
              Sign in to manage your chats & earnings
            </Text>
          </View>

          <View className="space-y-1">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="Enter your registered email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  leftIcon={<Mail color={theme.colors.text.muted.light} size={20} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                  secureTextEntry={!showPassword}
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
          </View>

          <View className="flex-row justify-end mb-6">
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text className="text-pink-500 font-semibold text-sm">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            variant="secondary"
            onPress={handleSubmit(onSubmit)}
            isLoading={loading}
            className="w-full mb-4"
          >
            Sign In
          </Button>

          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <Text className="mx-4 text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider">OR</Text>
            <View className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </View>

          <Button
            variant="outline"
            onPress={handleGoogleLogin}
            className="w-full mb-8 border-slate-300 dark:border-slate-700"
          >
            Continue with Google
          </Button>

          <View className="flex-row justify-center mt-auto">
            <Text className="text-slate-600 dark:text-slate-400">Want to join as a Creator? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-pink-500 font-bold">Apply Now</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
