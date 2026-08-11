import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Star, MessageCircle, Heart, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { GirlProfile } from '../../api/homeApi';
import { getAvatarUrl } from '../../utils/avatarUtil';

export function GirlAvatarCard({ girl }: { girl: GirlProfile }) {
  const navigation = useNavigation<any>();
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('GirlDetailScreen', { id: girl._id })}
      className="mr-5 items-center"
      activeOpacity={0.8}
    >
      <View className="relative w-16 h-16 p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400 items-center justify-center">
        <View className="w-full h-full rounded-full border-2 border-white dark:border-gray-900 overflow-hidden bg-gray-200 dark:bg-gray-800">
          <Image 
            source={{ uri: getAvatarUrl(girl.avatar, girl.name, girl._id) }} 
            className="w-full h-full rounded-full"
            style={{ borderRadius: 9999 }}
          />
        </View>
        {girl.isOnline && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </View>
      <Text className="mt-2 text-xs font-bold text-gray-800 dark:text-gray-200 max-w-[70px] text-center" numberOfLines={1}>
        {girl.name}
      </Text>
    </TouchableOpacity>
  );
}

export function GirlDetailCard({ girl }: { girl: GirlProfile }) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('GirlDetailScreen', { id: girl._id })}
      className="mr-4 w-72 h-36 rounded-3xl overflow-hidden relative shadow-md shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 bg-gray-900"
      activeOpacity={0.88}
    >
      {/* Full Landscape Cover Image */}
      <Image 
        source={{ uri: getAvatarUrl(girl.avatar, girl.name, girl._id) }} 
        className="w-full h-full absolute inset-0"
        style={{ resizeMode: 'cover' }}
      />
      
      {/* Top Header Overlay Badges */}
      <View className="absolute top-2.5 inset-x-3 flex-row items-center justify-between z-10">
        {/* Rating Pill */}
        <View className="bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full flex-row items-center border border-white/20">
          <View className="mr-1 items-center justify-center">
            <Star size={10} color="#fbbf24" fill="#fbbf24" />
          </View>
          <Text className="text-white text-[10px] font-black">
            {girl.averageRating ? girl.averageRating.toFixed(1) : '4.9'}
          </Text>
        </View>

        {/* Online Status Pill */}
        {girl.isOnline ? (
          <View className="bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 rounded-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
            <Text className="text-white text-[8px] font-black tracking-wide uppercase">ONLINE</Text>
          </View>
        ) : (
          <View className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
            <Text className="text-gray-300 text-[8px] font-bold uppercase">OFFLINE</Text>
          </View>
        )}
      </View>

      {/* Bottom Gradient Fade Overlay */}
      <View className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 justify-end z-10">
        <View className="flex-row items-end justify-between">
          <View className="flex-1 mr-2">
            {/* Creator Name & Verified Check */}
            <View className="flex-row items-center mb-0.5">
              <Text className="font-black text-white text-base mr-1" numberOfLines={1}>
                {girl.name}
              </Text>
              <View className="items-center justify-center">
                <ShieldCheck size={14} color="#60a5fa" />
              </View>
            </View>

            {/* Bio snippet */}
            <Text className="text-[11px] text-gray-200 font-medium opacity-90" numberOfLines={1}>
              {girl.bio || 'Available for private chats & calls'}
            </Text>

            {/* Rate Pill */}
            <View className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 self-start mt-1.5">
              <Text className="text-white text-[9px] font-black">1 coin/min</Text>
            </View>
          </View>

          {/* Chat Action Pill Button */}
          <View className="bg-indigo-600 px-3 py-2 rounded-2xl flex-row items-center shadow-md">
            <View className="mr-1 items-center justify-center">
              <MessageCircle size={12} color="#ffffff" />
            </View>
            <Text className="text-white text-xs font-black">Chat</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
