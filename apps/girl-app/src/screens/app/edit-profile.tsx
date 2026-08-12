import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Sparkles, Globe, Phone, ShieldCheck, Camera, User, Mail, Heart, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_GIRL_AVATARS, getAvatarUrl } from '../../utils/avatarUtil';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';

const LANGUAGE_SUGGESTIONS = ['English', 'Hindi', 'Punjabi', 'Bengali', 'Marathi', 'Telugu', 'Tamil'];

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

  const handleLanguageChipTap = (lang: string) => {
    if (!languagePreference) {
      setLanguagePreference(lang);
    } else if (languagePreference.includes(lang)) {
      const updated = languagePreference
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== lang)
        .join(', ');
      setLanguagePreference(updated);
    } else {
      setLanguagePreference(`${languagePreference.trim()}, ${lang}`);
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
            transformRequest: (data) => data,
            headers: { 'Accept': 'application/json' },
          });

          if (avatarRes.data?.data?.avatar) {
            finalAvatar = avatarRes.data.data.avatar;
          }
        } catch (uploadError: any) {
          console.warn('Avatar upload failed during edit save:', uploadError?.response?.data || uploadError?.message);
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
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
      {/* --- TOP HEADER --- */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700"
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#64748b" />
          </TouchableOpacity>
          <View>
            <Text className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Creator Profile</Text>
            <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Edit Profile</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isSaving}
          className="bg-pink-600 px-4 py-2 rounded-full flex-row items-center gap-1.5 shadow-md shadow-pink-600/30"
          activeOpacity={0.9}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Check size={16} color="#ffffff" />
              <Text className="text-white font-black text-xs uppercase tracking-wide">Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
        
        {/* --- HERO AVATAR SELECTION SECTION --- */}
        <View className="items-center mb-6">
          <TouchableOpacity 
            onPress={pickImage} 
            activeOpacity={0.85}
            className="relative"
          >
            <View className="w-32 h-32 rounded-full p-1 border-4 border-pink-500 shadow-2xl bg-white dark:bg-slate-900 relative overflow-hidden">
              <Image source={{ uri: selectedAvatar }} className="w-full h-full rounded-full" />
              <View className="absolute inset-0 bg-black/25 items-center justify-center">
                <View className="bg-pink-600 p-2.5 rounded-full shadow-lg border border-white">
                  <Camera size={20} color="#ffffff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={pickImage} 
            className="mt-3 flex-row items-center gap-1.5 bg-pink-500/10 dark:bg-pink-500/20 px-4 py-2 rounded-full border border-pink-500/30"
            activeOpacity={0.8}
          >
            <Camera size={14} color="#f43f5e" />
            <Text className="text-xs font-black text-pink-600 dark:text-pink-300">Upload Custom Photo</Text>
          </TouchableOpacity>
        </View>

        {/* --- AVATAR PRESET CAROUSEL --- */}
        <View className="mb-6 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={18} color="#f43f5e" />
              <Text className="text-sm font-black text-slate-900 dark:text-white">
                Choose Avatar Preset
              </Text>
            </View>
            <Text className="text-[11px] font-bold text-slate-400">Swipe to view</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
            {(DEFAULT_GIRL_AVATARS || []).map((url, idx) => {
              const isSelected = selectedAvatar === url;
              return (
                <TouchableOpacity
                  key={url || idx}
                  onPress={() => {
                    setCustomAvatarUri(null);
                    setSelectedAvatar(url);
                  }}
                  className={`mr-3 relative w-16 h-16 rounded-full border-2 overflow-hidden ${
                    isSelected ? 'border-pink-500 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: url }} className="w-full h-full rounded-full" />
                  {isSelected && (
                    <View className="absolute bottom-0 right-0 bg-pink-600 p-1 rounded-full border border-white">
                      <Check size={10} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* --- FORM SECTION CARDS --- */}
        <View className="space-y-4 mb-6">
          {/* Card 1: Basic Information */}
          <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Text className="text-xs font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-4">
              Basic Details
            </Text>

            {/* Display Name */}
            <View className="mb-4">
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <User size={14} color="#64748b" />
                <Text className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Creator Display Name
                </Text>
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your public host name"
                placeholderTextColor="#94a3b8"
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 h-13 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold"
              />
            </View>

            {/* Phone Number */}
            <View className="mb-4">
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <Phone size={14} color="#64748b" />
                <Text className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Phone Number
                </Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#94a3b8"
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 h-13 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold"
              />
            </View>

            {/* Email Address (Read-only) */}
            <View>
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center gap-1.5">
                  <Mail size={14} color="#64748b" />
                  <Text className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-slate-400">Read-only</Text>
              </View>
              <TextInput
                value={user?.email}
                editable={false}
                className="w-full bg-slate-100 dark:bg-slate-800/40 rounded-2xl px-4 h-13 text-slate-400 border border-slate-200 dark:border-slate-800 text-sm font-semibold"
              />
            </View>
          </View>

          {/* Card 2: Languages Spoken */}
          <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-3">
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <Globe size={14} color="#f43f5e" />
              <Text className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Languages Spoken
              </Text>
            </View>
            <TextInput
              value={languagePreference}
              onChangeText={setLanguagePreference}
              placeholder="e.g. English, Hindi, Punjabi"
              placeholderTextColor="#94a3b8"
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 h-13 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold mb-3"
            />

            {/* Quick Language Selection Chips */}
            <Text className="text-[11px] font-bold text-slate-400 mb-2">Tap to add quick language:</Text>
            <View className="flex-row flex-wrap gap-2">
              {LANGUAGE_SUGGESTIONS.map((lang) => {
                const isIncluded = languagePreference.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => handleLanguageChipTap(lang)}
                    className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1 ${
                      isIncluded
                        ? 'bg-pink-500/10 border-pink-500'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                    activeOpacity={0.8}
                  >
                    {isIncluded ? <Check size={12} color="#f43f5e" /> : <Plus size={12} color="#94a3b8" />}
                    <Text className={`text-xs font-bold ${isIncluded ? 'text-pink-600 dark:text-pink-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Card 3: Bio / About Me */}
          <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1.5">
                <Heart size={14} color="#f43f5e" />
                <Text className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Bio / About Me
                </Text>
              </View>
              <Text className="text-[10px] font-bold text-slate-400">{bio.length} chars</Text>
            </View>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell fans about your personality, hobbies, and when you are online to chat..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3.5 min-h-[110px] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium leading-relaxed"
            />
          </View>
        </View>

        {/* --- VERIFIED HOST BADGE & SAVE BUTTON --- */}
        <View className="bg-pink-500/10 dark:bg-pink-500/15 p-4 rounded-2xl border border-pink-500/20 flex-row items-center gap-3 mb-6">
          <ShieldCheck size={20} color="#10b981" />
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1 leading-snug">
            Your host profile is publicly visible to users searching for active creators.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="bg-pink-600 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-pink-600/40 mb-8"
          activeOpacity={0.9}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Check size={20} color="#ffffff" className="mr-2" />
              <Text className="text-white font-black text-base tracking-wide">Save Profile Changes</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
