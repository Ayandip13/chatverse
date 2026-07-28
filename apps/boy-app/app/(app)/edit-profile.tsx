import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, User, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import { useUpdateProfile } from '../../src/hooks/useUser';
import { getAvatarUrl } from '../../src/utils/avatarUtil';
import apiClient from '../../src/api/apiClient';

const BOY_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(getAvatarUrl(user?.avatar, user?.name, user?._id));
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
        setAvatar(uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    
    setIsSaving(true);
    let finalAvatar = avatar;

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

    updateProfile({ name: name.trim(), bio: bio.trim(), avatar: finalAvatar }, {
      onSuccess: () => {
        Alert.alert('Profile Saved', 'Your profile and picture have been updated!');
        router.back();
      },
      onError: (err: any) => {
        Alert.alert('Update Failed', err.message || 'Something went wrong');
      },
      onSettled: () => {
        setIsSaving(false);
      }
    });
  };

  const isLoadingState = isPending || isSaving;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={isLoadingState}>
          {isLoadingState ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-base">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        {/* Avatar Edit with Custom Photo Upload */}
        <View className="items-center mb-6">
          <TouchableOpacity 
            onPress={pickImage} 
            activeOpacity={0.8}
            className="relative w-28 h-28 rounded-full border-4 border-indigo-500/40 overflow-hidden shadow-lg bg-gray-200 dark:bg-gray-800"
          >
            <Image source={{ uri: avatar }} className="w-full h-full" />
            <View className="absolute inset-0 bg-black/20 items-center justify-center">
              <View className="bg-indigo-600 p-2 rounded-full shadow border border-white">
                <Camera size={18} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage} className="mt-2.5 flex-row items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            <Camera size={14} color="#4f46e5" />
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Upload Custom Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Preset Selector */}
        <View className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <View className="flex-row items-center gap-2 mb-3">
            <Sparkles size={16} color="#4f46e5" />
            <Text className="text-sm font-bold text-gray-900 dark:text-white">Or Select Avatar Preset</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(BOY_AVATAR_PRESETS || []).map((url, idx) => (
              <TouchableOpacity
                key={url || idx}
                onPress={() => {
                  setCustomAvatarUri(null);
                  setAvatar(url);
                }}
                style={avatar === url ? { transform: [{ scale: 1.05 }] } : undefined}
                className={`mr-3 w-14 h-14 rounded-full border-2 overflow-hidden ${
                  avatar === url ? 'border-indigo-600' : 'border-transparent opacity-70'
                }`}
              >
                <Image source={{ uri: url }} className="w-full h-full" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form */}
        <View className="mb-4">
          <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Display Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#9ca3af"
            className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 h-14 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</Text>
          <TextInput
            value={user?.email}
            editable={false}
            className="w-full bg-gray-100 dark:bg-gray-800/50 rounded-2xl px-4 h-14 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
          />
          <Text className="text-xs text-gray-400 mt-1 ml-1">Email cannot be changed.</Text>
        </View>

        <View className="mb-8">
          <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us a little about yourself"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4 min-h-[120px] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
