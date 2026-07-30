import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import apiClient, { getErrorMessage } from '../../api/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Enable web browser for auth session
WebBrowser.maybeCompleteAuthSession();

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Setup React Hook Form
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  // Google Auth Session Architecture Setup
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

      if (user.role !== 'BOY') {
        Alert.alert('Access Denied', 'This app is exclusively for boys.');
        return;
      }

      await setAuth(user, accessToken, refreshToken);
      // Navigation is handled automatically by the auth guard in _layout.tsx
    } catch (error: any) {
      console.log('Login Error:', error.response?.data || error.message);
      const message = getErrorMessage(error, 'Failed to connect to server');
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Will initiate Google flow when properly configured
    // promptAsync();
    Alert.alert('Google Auth', 'Google login architecture is implemented and ready for client IDs.');
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>

          <View className="mb-10 items-center">
            <View className="w-20 h-20 bg-indigo-500/10 rounded-2xl items-center justify-center mb-6">
              <User color={theme.colors.primary} size={40} />
            </View>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              Welcome Back
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center text-base">
              Sign in to your ChatVerse account
            </Text>
          </View>

          <View className="space-y-2">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="Enter your email"
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
                  isPassword
                  leftIcon={<Lock color={theme.colors.text.muted.light} size={20} />}
                />
              )}
            />
          </View>

          <View className="flex-row justify-end mb-6">
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text className="text-indigo-500 font-semibold">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            onPress={handleSubmit(onSubmit)}
            isLoading={loading}
            className="w-full mb-4"
          >
            Sign In
          </Button>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <Text className="mx-4 text-gray-500 dark:text-gray-400 font-medium">OR</Text>
            <View className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </View>

          <Button
            variant="outline"
            onPress={handleGoogleLogin}
            className="w-full mb-8"
          >
            Continue with Google
          </Button>

          <View className="flex-row justify-center mt-auto">
            <Text className="text-gray-600 dark:text-gray-400">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-indigo-500 font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
