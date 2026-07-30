import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Wallet, Coins, Lock, TrendingUp, ArrowDownToLine, History, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWithdrawalSummary, useMyWithdrawals } from '../../../src/hooks/useWithdrawals';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';

export default function WalletOverviewScreen() {
  const router = useRouter();
  const { data: summary, isLoading, refetch, isRefetching } = useWithdrawalSummary();
  const { data: historyData } = useMyWithdrawals({ page: 1, limit: 5 });

  const recentWithdrawals = historyData?.data || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Earnings & Wallet</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(app)/wallet/history')}
          className="flex-row items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full"
        >
          <History size={16} color="#64748b" />
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#e11d48" className="py-12" />
        ) : (
          <>
            {/* Primary Balance Card */}
            <View className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 rounded-3xl mb-6 border border-rose-400/30">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-rose-800 text-xs font-bold uppercase tracking-wider">Available Balance</Text>
                <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center border border-white/30">
                  <Coins size={20} color="#ffffff" />
                </View>
              </View>
              <Text className="text-black text-3xl font-extrabold font-mono mb-4">
                ₹{(summary?.availableBalance || 0).toLocaleString()}
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/(app)/wallet/withdraw')}
                className="bg-white py-3.5 rounded-2xl flex-row items-center justify-center shadow-md gap-2"
              >
                <ArrowDownToLine size={18} color="#e11d48" />
                <Text className="text-rose-600 font-extrabold text-sm">Request Withdrawal</Text>
              </TouchableOpacity>
            </View>

            {/* Metrics Breakdown Grid */}
            <View className="flex-row gap-4 mb-6">
              {/* Locked Balance */}
              <View className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <View className="w-8 h-8 rounded-full bg-amber-500/10 items-center justify-center mb-2">
                  <Lock size={16} color="#f59e0b" />
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Locked Balance</Text>
                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                  ₹{(summary?.lockedBalance || 0).toLocaleString()}
                </Text>
              </View>

              {/* Lifetime Earnings */}
              <View className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <View className="w-8 h-8 rounded-full bg-emerald-500/10 items-center justify-center mb-2">
                  <TrendingUp size={16} color="#10b981" />
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lifetime Earnings</Text>
                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                  ₹{(summary?.lifetimeEarnings || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Recent Withdrawals Section */}
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-slate-900 dark:text-white">Recent Requests</Text>
                <TouchableOpacity onPress={() => router.push('/(app)/wallet/history')}>
                  <Text className="text-xs font-bold text-pink-600 dark:text-pink-400">View All</Text>
                </TouchableOpacity>
              </View>

              {recentWithdrawals.length === 0 ? (
                <View className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 items-center">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    No withdrawal requests yet.
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {recentWithdrawals.map((item) => (
                    <TouchableOpacity
                      key={item._id}
                      onPress={() => router.push('/(app)/wallet/history')}
                      className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex-row items-center justify-between"
                    >
                      <View>
                        <Text className="text-base font-bold text-slate-900 dark:text-white font-mono">
                          ₹{item.amount}
                        </Text>
                        <Text className="text-xs text-slate-400 mt-0.5">
                          {item.paymentMethod} • {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <StatusBadge status={item.status} size="sm" />
                        <ChevronRight size={16} color="#94a3b8" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
