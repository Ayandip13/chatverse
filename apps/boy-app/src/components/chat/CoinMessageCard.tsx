import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle, Clock } from 'lucide-react-native';
import { ChatDetails } from '../../api/messagingApi';
import { ChatStatsData } from '../../hooks/useChatSocket';

interface CoinMessageCardProps {
  chat: ChatDetails;
  chatStats?: ChatStatsData | null;
  lowBalanceWarning?: string | null;
  elapsedSeconds?: number;
}

export function CoinMessageCard({ lowBalanceWarning, elapsedSeconds = 0 }: CoinMessageCardProps) {
  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs < 10 ? '0' : ''}${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View className="border-b border-indigo-100 dark:border-gray-800">
      {/* Active Session Timer Bar - Only Timer */}
      <View className="bg-indigo-50/60 dark:bg-gray-800/80 px-4 py-1.5 flex-row items-center justify-center">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-emerald-500" />
          <Clock size={13} color="#6366f1" />
          <Text className="text-xs font-mono font-bold text-gray-800 dark:text-gray-100">
            {formatTimer(elapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* Low Balance Alert Bar */}
      {!!lowBalanceWarning && (
        <View className="bg-rose-100 dark:bg-rose-950/80 px-4 py-1.5 flex-row items-center">
          <View className="mr-1.5 items-center justify-center">
            <AlertTriangle size={13} color="#ef4444" />
          </View>
          <Text className="text-rose-700 dark:text-rose-300 text-[11px] font-bold flex-1" numberOfLines={1}>
            {lowBalanceWarning}
          </Text>
        </View>
      )}
    </View>
  );
}
