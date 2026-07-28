import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Sparkles, Globe, Phone, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { DEFAULT_GIRL_AVATARS, getAvatarUrl } from '../../src/utils/avatarUtil';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/api/apiClient';

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [languagePreference, setLanguagePreference] = useState(user?.languagePreference || 'English, Hindi');
  const [selectedAvatar, setSelectedAvatar] = useState(getAvatarUrl(user?.avatar, user?.name, user?._id));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.patch('/users/me', {
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        languagePreference: languagePreference.trim(),
        avatar: selectedAvatar,
      });

      const updatedData = response.data?.data;
      if (updatedData) {
        updateUser(updatedData);
      } else {
        updateUser({ 
          name: name.trim(), 
          bio: bio.trim(), 
          phone: phone.trim(), 
          languagePreference: languagePreference.trim(),
          avatar: selectedAvatar 
        });
      }

      queryClient.invalidateQueries({ queryKey: ['myProfile'] });

      Alert.alert('Profile Updated', 'Your creator profile details have been saved!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</Text>
        </View>

        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isSaving}
          className="bg-pink-600 px-4 py-2 rounded-full flex-row items-center gap-1 shadow-sm"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Check size={16} color="#ffffff" />
              <Text className="text-white font-bold text-sm">Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        
        {/* Selected Avatar Preview */}
        <View className="items-center mb-6">
          <View className="relative w-28 h-28 rounded-full border-4 border-pink-500/30 overflow-hidden shadow-lg bg-slate-200">
            <Image source={{ uri: selectedAvatar }} className="w-full h-full" />
          </View>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            Selected Profile Photo
          </Text>
        </View>

        {/* Avatar Preset Selector */}
        <View className="mb-6 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700">
          <View className="flex-row items-center gap-2 mb-3">
            <Sparkles size={18} color="#e11d48" />
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              Choose High-Res Avatar Preset
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            {DEFAULT_GIRL_AVATARS.map((url, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedAvatar(url)}
                className={`mr-3 w-16 h-16 rounded-full border-2 overflow-hidden ${
                  selectedAvatar === url ? 'border-pink-500 scale-105' : 'border-transparent opacity-70'
                }`}
              >
                <Image source={{ uri: url }} className="w-full h-full" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form Fields */}
        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Creator Display Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter display name"
              placeholderTextColor="#94a3b8"
              className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 h-14 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm"
            />
          </View>

          <View className="mt-3">
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Phone Number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor="#94a3b8"
              className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 h-14 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-mono"
            />
          </View>

          <View className="mt-3">
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Languages Spoken
            </Text>
            <TextInput
              value={languagePreference}
              onChangeText={setLanguagePreference}
              placeholder="e.g. English, Hindi, Punjabi"
              placeholderTextColor="#94a3b8"
              className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 h-14 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm"
            />
          </View>

          <View className="mt-3">
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Email Address (Read-only)
            </Text>
            <TextInput
              value={user?.email}
              editable={false}
              className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-4 h-14 text-slate-400 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </View>

          <View className="mt-3">
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Bio / About Me
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell fans about your interests and availability..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-4 min-h-[120px] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm"
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
