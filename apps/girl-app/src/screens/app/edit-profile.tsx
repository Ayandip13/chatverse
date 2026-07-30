import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Sparkles, Globe, Phone, ShieldCheck, Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_GIRL_AVATARS, getAvatarUrl } from '../../utils/avatarUtil';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [languagePreference, setLanguagePreference] = useState(user?.languagePreference || 'English, Hindi');
  const [selectedAvatar, setSelectedAvatar] = useState(getAvatarUrl(user?.avatar, user?.name, user?._id));
  const [customAvatarUri, setCustomAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        const uri = result.assets[0].uri;
        setCustomAvatarUri(uri);
        setSelectedAvatar(uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      let finalAvatar = selectedAvatar;

      // 1. Upload custom selected photo if picked from gallery
      if (customAvatarUri) {
        try {
          const formData = new FormData();
          const filename = customAvatarUri.split('/').pop() || 'avatar.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append('avatar', {
            uri: customAvatarUri,
            name: filename,
            type,
          } as any);

          const avatarRes = await apiClient.post('/users/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (avatarRes.data?.data?.avatar) {
            finalAvatar = avatarRes.data.data.avatar;
          }
        } catch (uploadError) {
          console.warn('Avatar upload failed during edit save:', uploadError);
        }
      }

      // 2. Update user profile fields
      const response = await apiClient.patch('/users/me', {
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        languagePreference: languagePreference.trim(),
        avatar: finalAvatar,
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
          avatar: finalAvatar 
        });
      }

      queryClient.invalidateQueries({ queryKey: ['myProfile'] });

      Alert.alert('Profile Updated', 'Your creator profile details have been saved!', [
        { text: 'OK', onPress: () => navigation.goBack() }
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
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
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
        
        {/* Selected Profile Photo & Custom Photo Camera Upload */}
        <View className="items-center mb-6">
          <TouchableOpacity 
            onPress={pickImage} 
            activeOpacity={0.8}
            className="relative w-28 h-28 rounded-full border-4 border-pink-500/40 overflow-hidden shadow-lg bg-slate-200"
          >
            <Image source={{ uri: selectedAvatar }} className="w-full h-full" />
            <View className="absolute inset-0 bg-black/20 items-center justify-center">
              <View className="bg-pink-500 p-2 rounded-full shadow border border-white">
                <Camera size={18} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage} className="mt-2.5 flex-row items-center gap-1.5 bg-pink-50 dark:bg-pink-900/30 px-3.5 py-1.5 rounded-full border border-pink-200 dark:border-pink-800">
            <Camera size={14} color="#e11d48" />
            <Text className="text-xs font-bold text-pink-600 dark:text-pink-400">Upload Custom Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Preset Selector */}
        <View className="mb-6 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700">
          <View className="flex-row items-center gap-2 mb-3">
            <Sparkles size={18} color="#e11d48" />
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              Or Select Avatar Preset
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            {(DEFAULT_GIRL_AVATARS || []).map((url, idx) => (
              <TouchableOpacity
                key={url || idx}
                onPress={() => {
                  setCustomAvatarUri(null);
                  setSelectedAvatar(url);
                }}
                style={selectedAvatar === url ? { transform: [{ scale: 1.05 }] } : undefined}
                className={`mr-3 w-16 h-16 rounded-full border-2 overflow-hidden ${
                  selectedAvatar === url ? 'border-pink-500' : 'border-transparent opacity-70'
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
              maxLength={10}
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
