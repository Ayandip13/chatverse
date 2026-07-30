import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Phone, FileText, Camera, CheckSquare, Square, ShieldCheck, Heart } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import apiClient, { getErrorMessage } from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { theme } from '../../constants/theme';

const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service & Creator Guidelines'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      bio: '',
      termsAccepted: false
    }
  });

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access gallery is required to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    // 1. Mandatory Profile Picture Validation
    if (!avatarUri) {
      Alert.alert(
        'Profile Picture Required', 
        'Please upload your real profile picture to complete your creator application.'
      );
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'GIRL',
        bio: data.bio || undefined,
      };

      // 2. Register Girl User
      const response = await apiClient.post('/auth/register', payload);
      const { user, accessToken, refreshToken } = response.data.data;

      // 3. Set Auth State (User status will be PENDING)
      await setAuth(user, accessToken, refreshToken);

      // 4. Upload Avatar
      try {
        const formData = new FormData();
        const filename = avatarUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('avatar', {
          uri: avatarUri,
          name: filename,
          type,
        } as any);

        const avatarRes = await apiClient.post('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (avatarRes.data?.data?.avatar) {
          useAuthStore.getState().updateUser({ avatar: avatarRes.data.data.avatar });
        }
      } catch (uploadError) {
        console.warn('Avatar upload failed during registration:', uploadError);
      }

      // Navigation is automatically routed to Pending Verification via auth guard
    } catch (error: any) {
      console.log('Registration Error:', error.response?.data || error.message);
      const message = getErrorMessage(error, 'Failed to create account');
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>

          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-3xl font-extrabold text-slate-900 dark:text-white">Creator Application</Text>
              <Heart color={theme.colors.secondary} size={24} fill={theme.colors.secondary} />
            </View>
            <Text className="text-slate-500 dark:text-slate-400 font-medium text-base">
              Apply to become a verified ChatVerse creator
            </Text>
          </View>

          {/* Mandatory Profile Picture Upload Section */}
          <View className="items-center mb-6">
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.8}
              className={`relative w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center border-2 shadow-md ${
                avatarUri ? 'border-pink-500' : 'border-dashed border-pink-500'
              }`}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} className="w-full h-full rounded-full" />
              ) : (
                <View className="items-center justify-center">
                  <Camera color={theme.colors.secondary} size={32} />
                  <Text className="text-[10px] font-bold text-pink-500 mt-1">UPLOAD PHOTO</Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-pink-500 w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-slate-900 shadow">
                <Camera color="white" size={14} />
              </View>
            </TouchableOpacity>
            <Text className="text-xs font-bold text-pink-600 dark:text-pink-400 mt-2">
              Real Profile Photo (Required *)
            </Text>
          </View>

          <View className="space-y-1">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your official name"
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
                  placeholder="Enter your primary email"
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
                  label="Phone Number (Required for Manual Verification)"
                  placeholder="Enter 10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
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
              name="bio"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Creator Bio (Optional)"
                  placeholder="Tell us a little about your interests or persona..."
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.bio?.message}
                  leftIcon={<FileText color={theme.colors.text.muted.light} size={20} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Create password (min 6 chars)"
                  isPassword
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
                  placeholder="Re-enter password"
                  isPassword
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
                      <CheckSquare color={theme.colors.secondary} size={24} />
                    ) : (
                      <Square color={theme.colors.text.muted.light} size={24} />
                    )}
                    <Text className="flex-1 text-slate-700 dark:text-slate-300 text-sm">
                      I agree to Creator Verification Terms and Platform Guidelines
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

          {/* Security Banner */}
          <View className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6 flex-row items-start gap-3">
            <ShieldCheck color={theme.colors.primary} size={22} className="mt-0.5" />
            <Text className="flex-1 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
              After submitting, your application will enter <Text className="font-bold">Pending Verification</Text>. An administrator will review your real profile picture and phone number before activating your profile.
            </Text>
          </View>

          <Button
            variant="secondary"
            onPress={handleSubmit(onSubmit)}
            isLoading={loading}
            className="w-full mb-8"
          >
            Submit Application
          </Button>

          <View className="flex-row justify-center mt-auto">
            <Text className="text-slate-600 dark:text-slate-400">Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-pink-500 font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
