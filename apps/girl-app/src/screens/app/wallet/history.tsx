import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  History,
  XCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import {
  useMyWithdrawals,
  useCancelWithdrawal,
} from "../../../hooks/useWithdrawals";
import { StatusBadge } from "../../../components/ui/StatusBadge";

const TABS = ["ALL", "PENDING", "APPROVED", "COMPLETED", "REJECTED"];

export default function WithdrawalHistoryScreen() {
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState<string>("ALL");

  const { data, isLoading, refetch, isRefetching } = useMyWithdrawals({
    page: 1,
    limit: 50,
    status: selectedTab === "ALL" ? undefined : selectedTab,
  });

  const { mutate: cancelRequest, isPending: isCancelling } =
    useCancelWithdrawal();

  const withdrawals = data?.data || [];

  const handleCancel = (requestId: string) => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this pending withdrawal request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            cancelRequest(requestId, {
              onSuccess: () => {
                Alert.alert(
                  "Cancelled",
                  "Withdrawal request cancelled and funds refunded to your available balance.",
                );
              },
              onError: (err: any) => {
                Alert.alert(
                  "Cancel Failed",
                  err.response?.data?.message ||
                    err.message ||
                    "Failed to cancel request.",
                );
              },
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      edges={["top"]}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            Withdrawal History
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white dark:bg-slate-900 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedTab(item)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                selectedTab === item
                  ? "bg-rose-500 border-rose-500"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Text
                className={`text-xs font-bold ${selectedTab === item ? "text-white" : "text-slate-600 dark:text-slate-300"}`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List Content */}
      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#e11d48" className="py-12" />
          ) : (
            <View className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 items-center justify-center">
              <History size={36} color="#94a3b8" className="mb-2" />
              <Text className="text-base font-bold text-slate-800 dark:text-slate-200">
                No History Found
              </Text>
              <Text className="text-xs text-slate-400 text-center mt-1">
                You have no withdrawal records under the "{selectedTab}" status
                tab.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View className="bg-white dark:bg-slate-800 p-5 rounded-3xl mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  ₹{item.amount}
                </Text>
                <StatusBadge status={item.status} size="sm" />
              </View>

              {item.status === "PENDING" && (
                <TouchableOpacity
                  onPress={() => handleCancel(item._id)}
                  disabled={isCancelling}
                  className="bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800"
                >
                  <Text className="text-rose-600 dark:text-rose-400 text-xs font-bold">
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Requested:{" "}
              {new Date(item.requestedAt || item.createdAt).toLocaleString()} •{" "}
              {item.paymentMethod}
            </Text>

            {item.paymentMethod === "UPI" ? (
              <Text className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                UPI ID: {item.upiId}
              </Text>
            ) : item.bankDetails ? (
              <Text className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                Bank: {item.bankDetails.accountName} (
                {item.bankDetails.accountNumber.slice(-4)}) •{" "}
                {item.bankDetails.ifscCode}
              </Text>
            ) : null}

            {/* Rejection Reason display */}
            {item.status === "REJECTED" && item.rejectionReason && (
              <View className="mt-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/50 flex-row items-start gap-2">
                <AlertCircle size={16} color="#ef4444" className="mt-0.5" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-red-700 dark:text-red-400">
                    Rejection Reason:
                  </Text>
                  <Text className="text-xs text-red-600 dark:text-red-300">
                    {item.rejectionReason}
                  </Text>
                </View>
              </View>
            )}

            {/* Completed Transaction Ref */}
            {item.status === "COMPLETED" && item.transactionReference && (
              <View className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex-row items-center gap-2">
                <CheckCircle2 size={16} color="#10b981" />
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Ref: {item.transactionReference}
                </Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
