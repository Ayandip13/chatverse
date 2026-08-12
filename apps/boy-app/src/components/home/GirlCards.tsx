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
      className="mr-4 w-[300px] h-32 rounded-2xl p-3 border border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 flex-row items-center shadow-md shadow-gray-200/50 dark:shadow-none relative overflow-hidden"
      activeOpacity={0.88}
    >
      {/* Decorative ambient background accent */}
      <View className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-xl pointer-events-none" />

      {/* LEFT: Rounded Square Profile Picture with Ring & Status */}
      <View className="relative w-20 h-20 p-0.5 rounded-2xl bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400 items-center justify-center shadow-sm">
        <View className="w-full h-full rounded-xl border-2 border-white dark:border-gray-800 overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image 
            source={{ uri: getAvatarUrl(girl.avatar, girl.name, girl._id) }} 
            className="w-full h-full rounded-xl"
            style={{ borderRadius: 12 }}
          />
        </View>

        {/* Online / Offline Status Badge */}
        {girl.isOnline ? (
          <View className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 items-center justify-center shadow-sm">
            <View className="w-1.5 h-1.5 bg-white rounded-full" />
          </View>
        ) : (
          <View className="absolute -bottom-1 -right-1 bg-gray-400 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </View>

      {/* RIGHT: Details beside PFP */}
      <View className="flex-1 ml-3.5 flex-col justify-between h-full py-0.5">
        {/* Top Header: Name & Rating */}
        <View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-1">
              <Text className="font-extrabold text-gray-900 dark:text-white text-base mr-1" numberOfLines={1}>
                {girl.name}
              </Text>
              <ShieldCheck size={14} color="#3b82f6" />
            </View>

            {/* Rating Badge */}
            <View className="bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex-row items-center border border-amber-200/60 dark:border-amber-900/40">
              <Star size={10} color="#fbbf24" fill="#fbbf24" className="mr-0.5" />
              <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-black">
                {girl.averageRating ? girl.averageRating.toFixed(1) : '4.9'}
              </Text>
            </View>
          </View>

          {/* Bio snippet */}
          <Text className="text-xs font-medium text-gray-400 dark:text-gray-400 mt-1" numberOfLines={1}>
            {girl.bio || 'Available for private chats & calls'}
          </Text>
        </View>

        {/* Bottom Actions: Pricing & Chat Button */}
        <View className="flex-row items-center justify-between mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700/60">
          <View className="bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <Text className="text-indigo-600 dark:text-indigo-300 text-[10px] font-black">
              1 coin / min
            </Text>
          </View>

          <View className="bg-indigo-600 px-3.5 py-1.5 rounded-xl flex-row items-center shadow-xs shadow-indigo-500/30">
            <MessageCircle size={12} color="#ffffff" className="mr-1" />
            <Text className="text-white text-xs font-black">Chat</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
