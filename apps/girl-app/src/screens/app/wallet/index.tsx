import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Wallet, Coins, Lock, TrendingUp, ArrowDownToLine, History, ChevronRight, Sparkles, CreditCard, Zap } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useWithdrawalSummary, useMyWithdrawals } from '../../../hooks/useWithdrawals';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export default function WalletOverviewScreen() {
  const navigation = useNavigation<any>();
  const { data: summary, isLoading, refetch, isRefetching } = useWithdrawalSummary();
  const { data: historyData } = useMyWithdrawals({ page: 1, limit: 5 });

  const recentWithdrawals = historyData?.data || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
      {/* --- TOP HEADER --- */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700"
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#64748b" />
          </TouchableOpacity>
          <View>
            <Text className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Financial Suite</Text>
            <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Earnings & Wallet</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('WalletHistory')}
          className="flex-row items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700"
          activeOpacity={0.8}
        >
          <History size={16} color="#64748b" />
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5 py-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f43f5e" colors={['#f43f5e']} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#f43f5e" className="py-16" />
        ) : (
          <>
            {/* --- PRIMARY AVAILABLE BALANCE HERO CARD --- */}
            <View className="bg-slate-900 dark:bg-slate-900 p-6 rounded-3xl mb-6 border border-slate-800 shadow-2xl relative overflow-hidden">
              {/* Ambient Glow Effects */}
              <View className="absolute -top-10 -right-10 w-36 h-36 bg-pink-500/25 rounded-full blur-2xl pointer-events-none" />
              <View className="absolute -bottom-10 -left-10 w-36 h-36 bg-rose-600/15 rounded-full blur-2xl pointer-events-none" />

              <View className="flex-row items-center justify-between mb-2 relative z-10">
                <View className="flex-row items-center gap-2">
                  <Sparkles size={16} color="#f43f5e" />
                  <Text className="text-slate-300 text-xs font-extrabold uppercase tracking-widest">Available Balance</Text>
                </View>
                <View className="w-9 h-9 rounded-full bg-pink-500/20 items-center justify-center border border-pink-500/40 shadow-sm">
                  <Coins size={18} color="#f43f5e" />
                </View>
              </View>

              {/* Large Monospace Balance Figure */}
              <View className="flex-row items-baseline gap-2 mb-4 relative z-10">
                <Text className="text-white text-4xl font-black font-mono tracking-tight">
                  {(summary?.availableBalance || 0).toLocaleString()}
                </Text>
                <View className="bg-pink-500/20 px-2.5 py-0.5 rounded-full border border-pink-500/30">
                  <Text className="text-pink-300 font-extrabold text-xs uppercase">Coins</Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('WalletWithdraw')}
                className="bg-pink-600 dark:bg-pink-600 py-3.5 px-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-pink-600/40 gap-2 relative z-10"
                activeOpacity={0.9}
              >
                <ArrowDownToLine size={18} color="#ffffff" />
                <Text className="text-white font-black text-sm tracking-wide">Request Payout</Text>
              </TouchableOpacity>
            </View>

            {/* --- METRICS BREAKDOWN GRID --- */}
            <View className="flex-row gap-3 mb-6">
              {/* Locked Balance */}
              <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <View className="w-8 h-8 rounded-xl bg-amber-500/10 items-center justify-center mb-2.5 border border-amber-500/20">
                  <Lock size={16} color="#f59e0b" />
                </View>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">Locked / Pending</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
                  ₹{(summary?.lockedBalance || 0).toLocaleString()}
                </Text>
              </View>

              {/* Lifetime Earnings */}
              <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <View className="w-8 h-8 rounded-xl bg-emerald-500/10 items-center justify-center mb-2.5 border border-emerald-500/20">
                  <TrendingUp size={16} color="#10b981" />
                </View>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">Total Lifetime</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
                  ₹{(summary?.lifetimeEarnings || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Lifetime Withdraw Breakdown Card */}
            {summary?.lifetimeWithdraw !== undefined && (
              <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 flex-row items-center justify-between shadow-sm">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center border border-indigo-500/20">
                    <Wallet size={18} color="#6366f1" />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Withdrawn</Text>
                    <Text className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                      ₹{(summary.lifetimeWithdraw || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('WalletHistory')} activeOpacity={0.8}>
                  <Text className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">View Log</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* --- RECENT WITHDRAWALS SECTION --- */}
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-black text-slate-900 dark:text-white tracking-tight">Recent Payout Requests</Text>
                <TouchableOpacity onPress={() => navigation.navigate('WalletHistory')}>
                  <Text className="text-xs font-extrabold text-pink-600 dark:text-pink-400">View All</Text>
                </TouchableOpacity>
              </View>

              {recentWithdrawals.length === 0 ? (
                <View className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 items-center justify-center shadow-sm">
                  <View className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mb-2.5">
                    <Wallet size={24} color="#94a3b8" />
                  </View>
                  <Text className="text-slate-900 dark:text-white font-extrabold text-sm">
                    No Payout Requests Yet
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-1">
                    When you request a withdrawal, your transactions will be listed here.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {recentWithdrawals.map((item: any) => (
                    <TouchableOpacity
                      key={item._id}
                      onPress={() => navigation.navigate('WalletHistory')}
                      className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex-row items-center justify-between shadow-sm active:scale-[0.99]"
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-2xl bg-pink-500/10 items-center justify-center border border-pink-500/20">
                          {item.paymentMethod === 'UPI' ? (
                            <Zap size={18} color="#f43f5e" />
                          ) : (
                            <CreditCard size={18} color="#f43f5e" />
                          )}
                        </View>
                        <View>
                          <Text className="text-base font-black text-slate-900 dark:text-white font-mono">
                            ₹{item.amount?.toLocaleString()}
                          </Text>
                          <Text className="text-xs text-slate-400 font-medium mt-0.5">
                            {item.paymentMethod} • {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
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
