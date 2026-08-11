import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, History, XCircle, Zap, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useMyWithdrawals, useCancelWithdrawal } from '../../../hooks/useWithdrawals';
import { StatusBadge } from '../../../components/ui/StatusBadge';

const TABS = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'];

export default function WithdrawalHistoryScreen() {
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState<string>('ALL');

  const { data, isLoading, refetch, isRefetching } = useMyWithdrawals({
    page: 1,
    limit: 50,
    status: selectedTab === 'ALL' ? undefined : selectedTab,
  });

  const { mutate: cancelRequest, isPending: isCancelling } = useCancelWithdrawal();

  const withdrawals = data?.data || [];

  const handleCancel = (requestId: string) => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this pending withdrawal request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          cancelRequest(requestId, {
            onSuccess: () => {
              Alert.alert('Cancelled', 'Withdrawal request cancelled and funds refunded to your available balance.');
            },
            onError: (err: any) => {
              Alert.alert('Cancel Failed', err.response?.data?.message || err.message || 'Failed to cancel request.');
            },
          });
        },
      },
    ]);
  };

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
            <Text className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Audit Log</Text>
            <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Withdrawal History</Text>
          </View>
        </View>
      </View>

      {/* --- FILTER TABS --- */}
      <View className="bg-white dark:bg-slate-900 px-5 py-3 border-b border-slate-200 dark:border-slate-800">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = selectedTab === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedTab(item)}
                className={`mr-2.5 px-4 py-2 rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-pink-600 border-pink-600'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
                activeOpacity={0.8}
              >
                <Text className={`text-xs font-black tracking-wide ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* --- LIST CONTENT --- */}
      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f43f5e" colors={['#f43f5e']} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#f43f5e" className="py-16" />
          ) : (
            <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 items-center justify-center text-center shadow-sm">
              <View className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3">
                <History size={28} color="#94a3b8" />
              </View>
              <Text className="text-slate-900 dark:text-white font-black text-base">No Withdrawal Logs</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-1">
                No records found under the "{selectedTab}" filter.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isPendingStatus = item.status === 'PENDING';
          const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';

          return (
            <View className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 mb-3 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-11 h-11 rounded-2xl bg-pink-500/10 items-center justify-center border border-pink-500/20">
                    {item.paymentMethod === 'UPI' ? (
                      <Zap size={20} color="#f43f5e" />
                    ) : (
                      <CreditCard size={20} color="#f43f5e" />
                    )}
                  </View>
                  <View>
                    <Text className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      ₹{item.amount?.toLocaleString()}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {item.paymentMethod} {item.upiId ? `(${item.upiId})` : ''}
                    </Text>
                  </View>
                </View>

                <StatusBadge status={item.status} size="sm" />
              </View>

              <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <Text className="text-[11px] text-slate-400 font-medium">
                  {formattedDate}
                </Text>

                {isPendingStatus && (
                  <TouchableOpacity
                    onPress={() => handleCancel(item._id)}
                    disabled={isCancelling}
                    className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20"
                    activeOpacity={0.8}
                  >
                    <XCircle size={12} color="#f43f5e" />
                    <Text className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">Cancel Request</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
