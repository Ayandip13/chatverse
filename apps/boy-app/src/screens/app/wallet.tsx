import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, PlusCircle, Coins, Sparkles } from 'lucide-react-native';

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
        params: { limit: 5 }
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
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">My Wallet</Text>

        {/* Premium Ambient Hero Wallet Card */}
        <View className="bg-indigo-600 dark:bg-indigo-800 rounded-3xl p-6 shadow-xl shadow-indigo-500/25 relative overflow-hidden mb-6 border border-indigo-500/30">
          <View className="absolute -top-10 -right-10 w-36 h-36 bg-violet-400/25 rounded-full blur-2xl" />
          <View className="absolute -bottom-8 -left-8 w-28 h-28 bg-indigo-400/20 rounded-full blur-xl" />

          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className="mr-2 items-center justify-center">
                <Coins size={22} color="#f59e0b" fill="#fbbf24" />
              </View>
              <Text className="text-indigo-100 font-extrabold text-sm uppercase tracking-wider">Available Coin</Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full border border-white/20">
              <Text className="text-white text-[10px] font-black tracking-wide">LIVE BALANCE</Text>
            </View>
          </View>

          {isLoading ? (
            <Skeleton width={140} height={42} borderRadius={12} className="mb-3 bg-white/20" />
          ) : (
            <View className="flex-row items-baseline mb-2">
              <Text className="text-5xl font-black text-white tracking-tight mr-2">
                {walletData?.currentBalance?.toLocaleString() || '0'}
              </Text>
              <Text className="text-indigo-200 font-black text-xl">Coins</Text>
            </View>
          )}

          <View className="flex-row items-center pt-3 border-t border-indigo-500/40">
            <View className="mr-1.5 items-center justify-center">
              <Sparkles size={14} color="#a5b4fc" />
            </View>
            <Text className="text-indigo-200 text-xs font-medium">1 Coin = 1 Min Talk • Valid for calls & chats</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3.5 mb-8">
          <Button
            variant="primary"
            className="flex-1 bg-indigo-600 active:bg-indigo-700 py-4 rounded-3xl shadow-md shadow-indigo-500/20"
            leftIcon={
              <View className="mr-2 items-center justify-center">
                <PlusCircle color="#ffffff" size={18} />
              </View>
            }
            onPress={() => navigation.navigate('Recharge')}
          >
            Add Coins
          </Button>
          <Button
            variant="outline"
            className="flex-1 py-4 rounded-3xl bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/80"
            leftIcon={
              <View className="mr-2 items-center justify-center">
                <Clock color="#6366f1" size={18} />
              </View>
            }
            onPress={() => navigation.navigate('Transactions')}
          >
            History
          </Button>
        </View>

        {/* Summary Stats */}
        <View className="flex-row gap-3.5 mb-8">
          <View className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80">
            <View className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mb-3">
              <ArrowDownLeft color="#10b981" size={20} />
            </View>
            <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 mb-1 uppercase tracking-wider">Lifetime Recharge</Text>
            {isLoading ? (
              <Skeleton width={80} height={24} />
            ) : (
              <Text className="text-xl font-black text-gray-900 dark:text-white">
                ₹{walletData?.lifetimeRecharge?.toLocaleString() || '0'}
              </Text>
            )}
          </View>

          <View className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80">
            <View className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/30 items-center justify-center mb-3">
              <ArrowUpRight color="#ef4444" size={20} />
            </View>
            <Text className="text-xs font-bold text-gray-400 dark:text-gray-400 mb-1 uppercase tracking-wider">Lifetime Spent</Text>
            {isLoading ? (
              <Skeleton width={80} height={24} />
            ) : (
              <Text className="text-xl font-black text-gray-900 dark:text-white">
                {walletData?.lifetimeSpent?.toLocaleString() || '0'} Coins
              </Text>
            )}
          </View>
        </View>

        {/* Recent Transactions Preview */}
        <View className="mb-4 flex-row justify-between items-center px-1">
          <Text className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Recent Activity</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Transactions')}
            className="bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">See All</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-gray-700/80">
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
                  className={`flex-row items-center justify-between p-3.5 ${index !== transactionsData.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/60' : ''}`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${isCredit ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                      {isCredit ? <ArrowDownLeft color="#10b981" size={18} /> : <ArrowUpRight color="#ef4444" size={18} />}
                    </View>
                    <View>
                      <Text className="font-extrabold text-sm text-gray-900 dark:text-white capitalize">
                        {tx.type.toLowerCase().replace('_', ' ')}
                      </Text>
                      <Text className="text-xs font-medium text-gray-400 dark:text-gray-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text className={`font-black text-base ${isCredit ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                    {isCredit ? '+' : '-'}{tx.amount}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text className="text-center text-gray-400 font-medium py-8 text-xs">No recent transactions</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
