import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  Filter,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import apiClient from "../../api/apiClient";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { theme } from "../../constants/theme";

export default function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const [filterType, setFilterType] = useState<string | null>(null);

  const fetchTransactions = async ({ pageParam = 1 }) => {
    const res = await apiClient.get("/wallet/transactions", {
      params: {
        page: pageParam,
        limit: 15,
        ...(filterType ? { type: filterType } : {}),
      },
    });
    return res.data;
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["wallet-transactions", filterType],
    queryFn: fetchTransactions,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.meta) return undefined;
      const { page, limit, total } = lastPage.meta;
      const totalPages = Math.ceil(total / limit);
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const flattenData = data?.pages.flatMap((page) => page.data) || [];

  const renderItem = ({ item }: { item: any }) => {
    const isCredit = ["RECHARGE", "BONUS", "REFUND"].includes(item.type);

    return (
      <View className="flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center gap-4">
          <View
            className={`w-12 h-12 rounded-full items-center justify-center ${isCredit ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
          >
            {isCredit ? (
              <ArrowDownLeft color={theme.colors.success} size={24} />
            ) : (
              <ArrowUpRight color={theme.colors.danger} size={24} />
            )}
          </View>
          <View>
            <Text className="font-semibold text-gray-900 dark:text-white text-base capitalize">
              {item.type.toLowerCase().replace("_", " ")}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            {item.referenceId && (
              <Text className="text-xs text-gray-400 mt-1">
                Ref: {item.referenceId.substring(0, 8)}...
              </Text>
            )}
          </View>
        </View>
        <View className="items-end">
          <Text
            className={`font-bold text-lg ${isCredit ? "text-green-500" : "text-gray-900 dark:text-white"}`}
          >
            {isCredit ? "+" : "-"}
            {item.amount}
          </Text>
          <Text
            className={`text-xs mt-1 font-semibold ${item.status === "COMPLETED" ? "text-green-500" : item.status === "PENDING" ? "text-yellow-500" : "text-red-500"}`}
          >
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-4 py-3 flex-row items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 mr-2"
        >
          <ArrowLeft color={theme.colors.text.main.light} size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1">
          Transaction History
        </Text>

        {/* Simple filter toggle for demonstration */}
        <TouchableOpacity
          onPress={() =>
            setFilterType(filterType === "RECHARGE" ? null : "RECHARGE")
          }
          className={`p-2 rounded-full ${filterType ? "bg-indigo-100 dark:bg-indigo-900" : ""}`}
        >
          <Filter
            color={
              filterType ? theme.colors.primary : theme.colors.text.main.light
            }
            size={20}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              height={70}
              borderRadius={12}
              className="w-full"
            />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          title="Error Loading History"
          description="Please try again later."
        />
      ) : (
        <FlatList
          data={flattenData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              title="No Transactions"
              description={
                filterType
                  ? "No transactions found for this filter."
                  : "Your wallet history is empty."
              }
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-6 items-center">
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
