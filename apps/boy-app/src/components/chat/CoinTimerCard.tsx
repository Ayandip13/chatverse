import { View, Text } from 'react-native';
import { Timer, Coins } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { WalletSummary } from '../../api/homeApi';
import { ChatDetails } from '../../api/messagingApi';

export function CoinTimerCard({ chat }: { chat: ChatDetails }) {
  const queryClient = useQueryClient();
  const wallet = queryClient.getQueryData<WalletSummary>(['walletSummary']);
  const coinsPerMinute = 10; // Hardcoded default, should ideally come from platform settings or chat

  const balance = wallet?.currentBalance || 0;
  const remainingMinutes = Math.floor(balance / coinsPerMinute);

  return (
    <View className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 border-b border-amber-100 dark:border-amber-900/50 flex-row justify-between items-center">
      <View className="flex-row items-center">
        <Timer size={16} color="#d97706" className="mr-2" />
        <Text className="text-amber-700 dark:text-amber-500 text-xs font-semibold">
          {remainingMinutes} min remaining
        </Text>
      </View>
      <View className="flex-row items-center bg-white dark:bg-amber-900/40 px-2 py-1 rounded-full shadow-sm">
        <Coins size={12} color="#fbbf24" className="mr-1" />
        <Text className="text-amber-700 dark:text-amber-400 text-xs font-bold font-mono">
          {balance.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}
