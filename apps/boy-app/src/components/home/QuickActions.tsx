import { View, Text, TouchableOpacity } from 'react-native';
import { Wallet, MessageCircle, Heart, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    { id: 'wallet', title: 'Wallet', icon: Wallet, color: 'bg-emerald-500', route: '/wallet' },
    { id: 'chats', title: 'Chats', icon: MessageCircle, color: 'bg-blue-500', route: '/chats' },
    { id: 'favorites', title: 'Favorites', icon: Heart, color: 'bg-rose-500', route: '/favorites' },
    { id: 'premium', title: 'Premium', icon: Star, color: 'bg-amber-500', route: '/premium' },
  ];

  return (
    <View className="px-6 mb-8 flex-row justify-between">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <TouchableOpacity 
            key={action.id}
            onPress={() => router.push(action.route as any)}
            className="items-center"
          >
            <View className={`w-14 h-14 rounded-2xl ${action.color} items-center justify-center shadow-sm mb-2`}>
              <Icon size={24} color="#ffffff" />
            </View>
            <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
