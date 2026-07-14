import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageCircle, Star, ShieldAlert } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGirlDetails, useToggleFavorite } from '../../../src/hooks/useDiscovery';

export default function GirlDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data: girl, isLoading, isError } = useGirlDetails(id);
  const { mutate: toggleFavorite } = useToggleFavorite();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (isError || !girl) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-500">Could not load profile.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-indigo-600 px-6 py-2 rounded-full">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleToggleFavorite = () => {
    toggleFavorite({ id: girl._id, isFavorite: !girl.isFavorite });
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Photos Header */}
        <View className="relative w-full h-[450px]">
          <Image 
            source={{ uri: girl.avatar || 'https://via.placeholder.com/400x500' }} 
            className="w-full h-full"
            style={{ resizeMode: 'cover' }}
          />
          <View className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-black/30" />
          
          {/* Top Actions */}
          <SafeAreaView edges={['top']} className="absolute top-0 w-full flex-row justify-between px-6 pt-4">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md"
            >
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md"
            >
              <ShieldAlert size={20} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Bottom Info overlay */}
          <View className="absolute bottom-6 px-6 w-full flex-row justify-between items-end">
            <View>
              <View className="flex-row items-center mb-1">
                <Text className="text-white text-3xl font-extrabold mr-2 shadow-sm">{girl.name}</Text>
                {girl.isOnline && (
                  <View className="bg-green-500 px-2 py-1 rounded-full shadow-sm">
                    <Text className="text-white text-[10px] font-bold">ONLINE</Text>
                  </View>
                )}
              </View>
              
              <View className="flex-row items-center bg-black/40 px-3 py-1.5 rounded-full self-start backdrop-blur-md">
                <Star size={14} color="#fbbf24" fill="#fbbf24" className="mr-1" />
                <Text className="text-white text-xs font-bold">
                  {girl.averageRating?.toFixed(1) || 'NEW'} 
                  <Text className="text-gray-300 font-normal"> ({girl.totalReviews || 0} reviews)</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleToggleFavorite}
              className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${
                girl.isFavorite ? 'bg-white' : 'bg-black/40 backdrop-blur-md border border-white/20'
              }`}
            >
              <Heart 
                size={24} 
                color={girl.isFavorite ? "#ef4444" : "#ffffff"} 
                fill={girl.isFavorite ? "#ef4444" : "transparent"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Body */}
        <View className="px-6 py-6 pb-32">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">About Me</Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {girl.bio || "Hi there! I'm new here and looking forward to chatting."}
          </Text>

          {/* Stats/Badges */}
          <View className="flex-row flex-wrap gap-2 mb-8">
            <View className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-800">
              <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">Top Rated</Text>
            </View>
            <View className="bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800">
              <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Fast Replier</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Chat Button */}
      <View className="absolute bottom-0 w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
        <SafeAreaView edges={['bottom']}>
          <TouchableOpacity 
            onPress={() => router.push(`/chat/${girl._id}`)}
            className="w-full bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-indigo-500/30"
          >
            <MessageCircle size={24} color="#ffffff" className="mr-2" />
            <Text className="text-white text-lg font-bold">Start Chatting</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}
