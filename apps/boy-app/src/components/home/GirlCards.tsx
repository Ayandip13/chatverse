import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GirlProfile } from '../../api/homeApi';

export function GirlAvatarCard({ girl }: { girl: GirlProfile }) {
  const router = useRouter();
  
  return (
    <TouchableOpacity 
      onPress={() => router.push(`/girl/${girl._id}`)}
      className="mr-4 items-center"
    >
      <View className="relative w-16 h-16 rounded-full border-2 border-indigo-100 dark:border-gray-800 p-0.5">
        <Image 
          source={{ uri: girl.avatar || 'https://via.placeholder.com/150' }} 
          className="w-full h-full rounded-full"
        />
        {girl.isOnline && (
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </View>
      <Text className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200" numberOfLines={1}>
        {girl.name}
      </Text>
    </TouchableOpacity>
  );
}

export function GirlDetailCard({ girl }: { girl: GirlProfile }) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      onPress={() => router.push(`/girl/${girl._id}`)}
      className="mr-4 w-40 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-gray-700"
    >
      <View className="relative w-full h-48">
        <Image 
          source={{ uri: girl.avatar || 'https://via.placeholder.com/150' }} 
          className="w-full h-full"
          style={{ resizeMode: 'cover' }}
        />
        <View className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded-full flex-row items-center backdrop-blur-md">
          <Star size={12} color="#fbbf24" fill="#fbbf24" className="mr-1" />
          <Text className="text-white text-xs font-bold">{girl.averageRating?.toFixed(1) || 'NEW'}</Text>
        </View>
        {girl.isOnline && (
          <View className="absolute top-2 right-2 bg-green-500 px-2 py-1 rounded-full">
            <Text className="text-white text-[10px] font-bold">ONLINE</Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="font-bold text-gray-900 dark:text-white text-sm" numberOfLines={1}>
          {girl.name}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1" numberOfLines={2}>
          {girl.bio || 'Hi, let’s chat!'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
