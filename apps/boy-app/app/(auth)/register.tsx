import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Phone, CheckSquare, Square } from 'lucide-react-native';

import apiClient from '../../src/api/apiClient';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/constants/theme';
import { cn } from '../../src/utils/cn';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        role: 'BOY',
        gender: 'MALE', // Default gender for Boy App
      };

      const response = await apiClient.post('/auth/register', payload);
      const { user, accessToken, refreshToken } = response.data.data;
      
      await setAuth(user, accessToken, refreshToken);
      // Auth wrapper handles redirect to Home
    } catch (error: any) {
      console.log('Registration Error:', error.response?.data || error.message);
      const message = error.response?.data?.message || error.message || 'Failed to create account';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</Text>
            <Text className="text-gray-500 dark:text-gray-400 mt-2">
              Join ChatVerse to connect and chat
            </Text>
          </View>

          <View className="space-y-1">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                  leftIcon={<User color={theme.colors.text.muted.light} size={20} />}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                  leftIcon={<Mail color={theme.colors.text.muted.light} size={20} />}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number (Optional)"
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.phone?.message}
                  leftIcon={<Phone color={theme.colors.text.muted.light} size={20} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Create a password"
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                  leftIcon={<Lock color={theme.colors.text.muted.light} size={20} />}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                  leftIcon={<Lock color={theme.colors.text.muted.light} size={20} />}
                />
              )}
            />

            <Controller
              control={control}
              name="termsAccepted"
              render={({ field: { onChange, value } }) => (
                <View className="mb-6 mt-2">
                  <TouchableOpacity 
                    className="flex-row items-center gap-3"
                    onPress={() => onChange(!value)}
                    activeOpacity={0.7}
                  >
                    {value ? (
                      <CheckSquare color={theme.colors.primary} size={24} />
                    ) : (
                      <Square color={theme.colors.text.muted.light} size={24} />
                    )}
                    <Text className="flex-1 text-gray-700 dark:text-gray-300">
                      I agree to the Terms of Service and Privacy Policy
                    </Text>
                  </TouchableOpacity>
                  {errors.termsAccepted && (
                    <Text className="text-red-500 text-xs mt-1 font-medium ml-9">
                      {errors.termsAccepted.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          <Button
            onPress={handleSubmit(onSubmit)}
            isLoading={loading}
            className="w-full mt-4 mb-8"
          >
            Create Account
          </Button>

          <View className="flex-row justify-center mt-auto">
            <Text className="text-gray-600 dark:text-gray-400">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-indigo-500 font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
