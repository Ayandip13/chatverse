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
    <View className="bg-amber-50/80 dark:bg-amber-950/40 px-4 py-2 border-b border-amber-100 dark:border-amber-900/50">
      <View className="flex-row justify-between items-center">
        {/* Messages Billed */}
        <View className="flex-row items-center">
          <View className="flex-row items-center bg-amber-100/70 dark:bg-amber-900/50 px-2.5 py-1 rounded-xl mr-2">
            <View className="mr-1.5 items-center justify-center">
              <MessageSquare size={13} color="#d97706" />
            </View>
            <Text className="text-amber-900 dark:text-amber-300 font-mono font-black text-xs">
              {messagesSent} msgs sent
            </Text>
          </View>
          <Text className="text-amber-700 dark:text-amber-400 text-xs font-extrabold">
            (1 Coin = 1 Min Talk)
          </Text>
        </View>

        {/* Balance Badge */}
        <View className="flex-row items-center bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-xs border border-amber-200/80 dark:border-amber-800/60">
          <View className="mr-1.5 items-center justify-center">
            <Coins size={14} color="#f59e0b" fill="#fbbf24" />
          </View>
          <Text className="text-amber-800 dark:text-amber-300 text-xs font-black font-mono">
            {balance.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Low Balance Alert Banner */}
      {lowBalanceWarning && (
        <View className="flex-row items-center bg-rose-100 dark:bg-rose-950/60 px-3 py-1.5 rounded-xl mt-2 border border-rose-200 dark:border-rose-900/40">
          <View className="mr-1.5 items-center justify-center">
            <AlertTriangle size={14} color="#ef4444" />
          </View>
          <Text className="text-rose-700 dark:text-rose-300 text-xs font-bold flex-1" numberOfLines={1}>
            {lowBalanceWarning}
          </Text>
        </View>
      )}
    </View>
  );
}
