import React from 'react';
import { View, Text } from 'react-native';
import { MessageSquare, Coins, AlertTriangle } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { WalletSummary } from '../../api/homeApi';
import { ChatDetails } from '../../api/messagingApi';
import { ChatStatsData } from '../../hooks/useChatSocket';

interface CoinMessageCardProps {
  chat: ChatDetails;
  chatStats?: ChatStatsData | null;
  lowBalanceWarning?: string | null;
}

export function CoinMessageCard({ chat, chatStats, lowBalanceWarning }: CoinMessageCardProps) {
  const queryClient = useQueryClient();
  const wallet = queryClient.getQueryData<WalletSummary>(['walletSummary']);

  const balance = chatStats?.remainingCoins !== undefined 
    ? chatStats.remainingCoins 
    : wallet?.currentBalance || 0;

  const messagesSent = chatStats?.messagesSent || chat.totalCost || 0;

  return (
    <View className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 border-b border-amber-100 dark:border-amber-900/50">
      <View className="flex-row justify-between items-center">
        {/* Messages Billed */}
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center bg-amber-100/50 dark:bg-amber-900/40 px-2 py-1 rounded-lg">
            <MessageSquare size={14} color="#d97706" className="mr-1.5" />
            <Text className="text-amber-800 dark:text-amber-400 font-mono font-bold text-xs">
              {messagesSent} msgs sent
            </Text>
          </View>
          <Text className="text-amber-600 dark:text-amber-500 text-xs font-medium">
            (1 coin/msg)
          </Text>
        </View>

        {/* Balance Badge */}
        <View className="flex-row items-center bg-white dark:bg-amber-900/40 px-3 py-1 rounded-full shadow-sm border border-amber-200 dark:border-amber-800">
          <Coins size={14} color="#fbbf24" className="mr-1" />
          <Text className="text-amber-800 dark:text-amber-300 text-xs font-extrabold font-mono">
            {balance.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Low Balance Alert Banner */}
      {lowBalanceWarning && (
        <View className="flex-row items-center bg-red-100 dark:bg-red-900/40 px-3 py-1.5 rounded-xl mt-2 border border-red-200 dark:border-red-800">
          <AlertTriangle size={14} color="#ef4444" className="mr-1.5" />
          <Text className="text-red-700 dark:text-red-300 text-xs font-bold flex-1" numberOfLines={1}>
            {lowBalanceWarning}
          </Text>
        </View>
      )}
    </View>
  );
}
