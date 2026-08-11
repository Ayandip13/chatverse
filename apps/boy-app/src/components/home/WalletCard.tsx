import { View, Text, TouchableOpacity } from 'react-native';
import { Coins, Plus, Sparkles } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { WalletSummary } from '../../api/homeApi';
import { Skeleton } from '../ui/Skeleton';

interface WalletCardProps {
  wallet?: WalletSummary;
  isLoading: boolean;
}

export function WalletCard({ wallet, isLoading }: WalletCardProps) {
  const navigation = useNavigation<any>();

  return (
    <View className="px-6 mb-6">
      <View className="bg-indigo-600 dark:bg-indigo-800/90 rounded-3xl p-5 shadow-lg shadow-indigo-500/20 relative overflow-hidden border border-indigo-500/30">
        {/* Ambient Glow background elements */}
        <View className="absolute -top-12 -right-12 w-36 h-36 bg-violet-400/20 rounded-full blur-2xl" />
        <View className="absolute -bottom-8 -left-8 w-28 h-28 bg-indigo-400/20 rounded-full blur-xl" />

        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
              Available Coin
            </Text>
            {isLoading ? (
              <Skeleton className="w-32 h-8 rounded-lg bg-indigo-500/50" />
            ) : (
              <View className="flex-row items-center">
                <View className="mr-2 items-center justify-center">
                  <Coins size={26} color="#f59e0b" fill="#fbbf24" />
                </View>
                <Text className="text-3xl font-black text-white tracking-tight">
                  {wallet?.currentBalance?.toLocaleString() ?? '0'}
                </Text>
                <Text className="text-indigo-200 text-xs font-bold ml-1.5 self-end mb-1">
                  Coins
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Recharge')}
            className="bg-white/20 active:bg-white/30 px-4 py-2.5 rounded-2xl flex-row items-center border border-white/20 shadow-sm"
          >
            <View className="mr-1 items-center justify-center">
              <Plus size={16} color="#ffffff" strokeWidth={3} />
            </View>
            <Text className="text-white text-xs font-black tracking-wide">Top Up</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between bg-indigo-900/40 dark:bg-indigo-950/50 rounded-2xl px-4 py-2.5 border border-indigo-400/20">
          <View className="flex-row items-center">
            <View className="mr-2 items-center justify-center">
              <Sparkles size={14} color="#a5b4fc" />
            </View>
            <Text className="text-indigo-200 text-xs font-medium">
              Lifetime Recharge: <Text className="font-bold text-white">36k</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
