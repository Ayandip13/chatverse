import React from 'react';
import { View, Text } from 'react-native';
import { Timer, Coins, AlertTriangle } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { WalletSummary } from '../../api/homeApi';
import { ChatDetails } from '../../api/messagingApi';
import { ChatTickData, DisconnectState } from '../../hooks/useChatSocket';

interface CoinTimerCardProps {
  chat: ChatDetails;
  chatTick?: ChatTickData | null;
  lowBalanceWarning?: string | null;
  disconnectState?: DisconnectState | null;
}

export function CoinTimerCard({ chat, chatTick, lowBalanceWarning, disconnectState }: CoinTimerCardProps) {
  const queryClient = useQueryClient();
  const wallet = queryClient.getQueryData<WalletSummary>(['walletSummary']);

  const balance = chatTick?.remainingCoins !== undefined 
    ? chatTick.remainingCoins 
    : wallet?.currentBalance || 0;

  const coinsPerMinute = 10;
  const remainingMinutes = chatTick?.estimatedMinutesLeft !== undefined 
    ? chatTick.estimatedMinutesLeft 
    : Math.floor(balance / coinsPerMinute);

  const elapsedSeconds = chatTick?.elapsedSeconds || 0;
  const minutesStr = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const secondsStr = (elapsedSeconds % 60).toString().padStart(2, '0');

  return (
    <View className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 border-b border-amber-100 dark:border-amber-900/50">
      <View className="flex-row justify-between items-center">
        {/* Elapsed Timer & Rate */}
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center">
            <Timer size={16} color="#d97706" className="mr-1.5" />
            <Text className="text-amber-800 dark:text-amber-400 font-mono font-bold text-sm">
              {minutesStr}:{secondsStr}
            </Text>
          </View>
          <Text className="text-amber-600 dark:text-amber-500 text-xs">
            ({remainingMinutes}m left @ 10 coins/m)
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

      {/* Disconnect Reconnection Banner */}
      {disconnectState && (
        <View className="flex-row items-center bg-orange-100 dark:bg-orange-900/50 px-3 py-1.5 rounded-xl mt-2 border border-orange-300 dark:border-orange-700">
          <AlertTriangle size={14} color="#d97706" className="mr-1.5" />
          <Text className="text-amber-900 dark:text-amber-200 text-xs font-bold flex-1" numberOfLines={1}>
            Participant disconnected. Reconnecting ({disconnectState.graceSeconds}s)...
          </Text>
        </View>
      )}

      {/* Low Balance Alert Banner */}
      {lowBalanceWarning && !disconnectState && (
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
