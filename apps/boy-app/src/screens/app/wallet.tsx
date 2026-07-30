import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, PlusCircle } from 'lucide-react-native';

import apiClient from '../../api/apiClient';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { theme } from '../../constants/theme';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Wallet Summary
  const { data: walletData, isLoading, refetch, isError } = useQuery({
    queryKey: ['wallet-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/wallet');
      return res.data.data;
    },
  });

  // Fetch Recent Transactions
  const { data: transactionsData, isLoading: isTxLoading } = useQuery({
    queryKey: ['wallet-recent-transactions'],
    queryFn: async () => {
      const res = await apiClient.get('/wallet/transactions', {
        params: { limit: 5 } // Only grab top 5 for the wallet dashboard
      });
      return res.data.data;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isError) {
    return (
      <EmptyState
        title="Failed to load wallet"
        description="There was a problem securely fetching your balance."
        action={<Button onPress={() => refetch()}>Try Again</Button>}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Wallet</Text>

        {/* Premium Wallet Card */}
        <View className="bg-indigo-500 rounded-3xl p-6 shadow-lg shadow-indigo-500/30 mb-8">
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center gap-2">
              <WalletIcon color="white" size={24} />
              <Text className="text-indigo-100 font-semibold text-base">Coin Balance</Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">LIVE</Text>
            </View>
          </View>

          {isLoading ? (
            <Skeleton width={120} height={40} borderRadius={8} className="mb-2 bg-white/20" />
          ) : (
            <View className="flex-row items-end gap-2 mb-2">
              <Text className="text-5xl font-extrabold text-white tracking-tight">
                {walletData?.currentBalance?.toLocaleString() || '0'}
              </Text>
              <Text className="text-indigo-200 font-bold text-lg mb-2">Coins</Text>
            </View>
          )}
          <Text className="text-indigo-100 text-sm opacity-80">1 Coin = ₹1 (Approximate value)</Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4 mb-8">
          <Button
            variant="primary"
            className="flex-1 bg-gray-900 dark:bg-white py-4"
            leftIcon={<PlusCircle color={theme.colors.background.light} size={20} />}
            onPress={() => navigation.navigate('Recharge')}
          >
            Recharge
          </Button>
          <Button
            variant="outline"
            className="flex-1 py-4"
            leftIcon={<Clock color={theme.colors.primary} size={20} />}
            onPress={() => navigation.navigate('Transactions')}
          >
            History
          </Button>
        </View>

        {/* Summary Stats */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-3">
              <ArrowDownLeft color={theme.colors.success} size={20} />
            </View>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lifetime Recharge</Text>
            {isLoading ? (
              <Skeleton width={80} height={24} />
            ) : (
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {walletData?.lifetimeRecharge?.toLocaleString() || '0'}
              </Text>
            )}
          </View>
          <View className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-3">
              <ArrowUpRight color={theme.colors.danger} size={20} />
            </View>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lifetime Spent</Text>
            {isLoading ? (
              <Skeleton width={80} height={24} />
            ) : (
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {walletData?.lifetimeSpent?.toLocaleString() || '0'}
              </Text>
            )}
          </View>
        </View>

        {/* Recent Transactions Preview */}
        <View className="mb-4 flex-row justify-between items-center">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text className="text-indigo-500 font-semibold text-sm">See All</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-700">
          {isTxLoading ? (
            <View className="p-4 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} height={60} borderRadius={12} className="w-full" />)}
            </View>
          ) : transactionsData?.length > 0 ? (
            transactionsData.map((tx: any, index: number) => {
              const isCredit = ['RECHARGE', 'BONUS', 'REFUND'].includes(tx.type);
              return (
                <View 
                  key={tx._id} 
                  className={`flex-row items-center justify-between p-4 ${index !== transactionsData.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                >
                  <View className="flex-row items-center gap-4">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      {isCredit ? <ArrowDownLeft color={theme.colors.success} size={20} /> : <ArrowUpRight color={theme.colors.danger} size={20} />}
                    </View>
                    <View>
                      <Text className="font-semibold text-gray-900 dark:text-white capitalize">
                        {tx.type.toLowerCase().replace('_', ' ')}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text className={`font-bold text-base ${isCredit ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                    {isCredit ? '+' : '-'}{tx.amount}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text className="text-center text-gray-500 py-8">No recent transactions</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
