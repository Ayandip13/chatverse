import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, User, Camera, Mail, FileText, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useUpdateProfile } from '../../hooks/useUser';
import { getAvatarUrl } from '../../utils/avatarUtil';
import apiClient from '../../api/apiClient';

const BOY_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80',
];

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
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
          transformRequest: (data) => data,
          headers: { 'Accept': 'application/json' },
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
        Alert.alert('Profile Saved', 'Your profile details have been updated!');
        navigation.goBack();
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
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header Bar */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1.5 -ml-1 rounded-full active:bg-gray-100 dark:active:bg-gray-800">
            <View className="items-center justify-center">
              <ArrowLeft size={22} color="#374151" />
            </View>
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Edit Profile</Text>
            <Text className="text-xs font-semibold text-gray-400 dark:text-gray-400">Personal information</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isLoadingState}
          className="bg-indigo-600 active:bg-indigo-700 px-4 py-2 rounded-full shadow-sm shadow-indigo-500/20"
        >
          {isLoadingState ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white font-extrabold text-xs tracking-wide uppercase">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Avatar Uploader Hero Card */}
        <View className="items-center mb-6 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm shadow-gray-200/50 dark:shadow-none">
          <TouchableOpacity 
            onPress={pickImage} 
            activeOpacity={0.85}
            className="relative w-28 h-28 rounded-full p-0.5 border-4 border-indigo-500 bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400 shadow-xl shadow-indigo-500/25 mb-4 items-center justify-center"
          >
            <View className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              <Image source={{ uri: avatar }} className="w-full h-full rounded-full" style={{ borderRadius: 9999 }} />
            </View>
            <View className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full border-2 border-white dark:border-gray-900 shadow-md">
              <Camera size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={pickImage} 
            className="flex-row items-center bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-900/40"
            activeOpacity={0.7}
          >
            <View className="mr-1.5 items-center justify-center">
              <Camera size={14} color="#6366f1" />
            </View>
            <Text className="text-xs font-black text-indigo-600 dark:text-indigo-400">Upload Custom Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Preset Avatar Selector */}
        <View className="mb-6 bg-white dark:bg-gray-800 p-4.5 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm shadow-gray-200/50 dark:shadow-none">
          <View className="flex-row items-center mb-3">
            <View className="mr-2 items-center justify-center">
              <Sparkles size={16} color="#6366f1" />
            </View>
            <Text className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Or Select Preset Avatar</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
            {(BOY_AVATAR_PRESETS || []).map((url, idx) => {
              const isSelected = avatar === url;
              return (
                <TouchableOpacity
                  key={url || idx}
                  onPress={() => {
                    setCustomAvatarUri(null);
                    setAvatar(url);
                  }}
                  activeOpacity={0.8}
                  className={`mr-3 relative w-14 h-14 rounded-full p-0.5 border-2 ${
                    isSelected ? 'border-indigo-600 scale-105' : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <View className="w-full h-full rounded-full overflow-hidden">
                    <Image source={{ uri: url }} className="w-full h-full rounded-full" style={{ borderRadius: 9999 }} />
                  </View>
                  {isSelected && (
                    <View className="absolute bottom-0 right-0 bg-indigo-600 w-4 h-4 rounded-full items-center justify-center border border-white">
                      <Check size={10} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Form Input Fields */}
        <View className="space-y-4">
          {/* Display Name */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              Display Name
            </Text>
            <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-2xl px-4 h-14 border border-gray-100 dark:border-gray-700/80 shadow-xs">
              <View className="mr-3 items-center justify-center">
                <User size={18} color="#6366f1" />
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your display name"
                placeholderTextColor="#9ca3af"
                className="flex-1 text-gray-900 dark:text-white text-base font-extrabold"
              />
            </View>
          </View>

          {/* Email Address (Read Only) */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              Email Address
            </Text>
            <View className="flex-row items-center bg-gray-100/70 dark:bg-gray-800/40 rounded-2xl px-4 h-14 border border-gray-200/60 dark:border-gray-700/60">
              <View className="mr-3 items-center justify-center">
                <Mail size={18} color="#9ca3af" />
              </View>
              <TextInput
                value={user?.email}
                editable={false}
                className="flex-1 text-gray-500 dark:text-gray-400 text-base font-semibold"
              />
            </View>
            <Text className="text-[11px] font-medium text-gray-400 mt-1.5 ml-1">Email cannot be changed.</Text>
          </View>

          {/* Bio Text Area */}
          <View className="mb-8">
            <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              Bio
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/80 shadow-xs">
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell creators a little bit about yourself..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="w-full text-gray-900 dark:text-white text-sm font-medium min-h-[100px]"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
