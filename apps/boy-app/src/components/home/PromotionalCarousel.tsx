import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export function PromotionalCarousel() {
  const navigation = useNavigation<any>();
  
  return (
    <View className="px-6 mb-8">
      <TouchableOpacity 
        onPress={() => navigation.navigate('Recharge')}
        className="w-full h-36 rounded-3xl overflow-hidden relative"
      >
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80' }} 
          className="w-full h-full"
          style={{ resizeMode: 'cover' }}
        />
        <View className="absolute inset-0 bg-black/40 p-5 justify-center">
          <View className="bg-rose-500/90 self-start px-2 py-1 rounded-md mb-2">
            <Text className="text-white text-[10px] font-bold tracking-wider">LIMITED TIME</Text>
          </View>
          <Text className="text-white font-extrabold text-xl mb-1">Get 50% Off Coins</Text>
          <Text className="text-gray-200 text-xs mb-3">Recharge today and chat longer.</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
