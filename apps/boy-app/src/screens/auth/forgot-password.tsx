import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft } from 'lucide-react-native';

import apiClient from '../../api/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { theme } from '../../constants/theme';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setLoading(true);
      await apiClient.post('/auth/forgot-password', { email: data.email });
      setIsSuccess(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset link';
      Alert.alert('Request Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900 px-6">
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        className="mt-4 mb-8 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
      >
        <ArrowLeft color={theme.colors.text.main.light} size={24} />
      </TouchableOpacity>

      <View className="mb-10">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password</Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2">
          Enter your email address and we will send you instructions to reset your password.
        </Text>
      </View>

      {isSuccess ? (
        <View className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <Text className="text-green-800 font-medium text-center">
            If an account exists for that email, a password reset link has been sent. Please check your inbox.
          </Text>
          <Button 
            variant="outline" 
            className="mt-6 border-green-500"
            onPress={() => navigation.navigate('Login')}
          >
            Back to Login
          </Button>
        </View>
      ) : (
        <>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="Enter your registered email"
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

          <Button
            onPress={handleSubmit(onSubmit)}
            isLoading={loading}
            className="w-full mt-6"
          >
            Send Reset Link
          </Button>
        </>
      )}
    </SafeAreaView>
  );
}
