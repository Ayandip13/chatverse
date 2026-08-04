import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bell, CheckCheck, Circle } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from "../../hooks/useUser";
import { formatRelativeTime } from "../../utils/date";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Notification } from "../../api/userApi";

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useNotifications();

  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead } = useMarkAllRead();

  const allNotifications = data?.pages.flatMap((p) => p.items) || [];

  const handleMarkRead = (item: Notification) => {
    if (!item.isRead) {
      markRead(item._id);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      edges={["top"]}
    >
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Notifications
          </Text>
        </View>

        {allNotifications.some((n) => !n.isRead) && (
          <TouchableOpacity onPress={() => markAllRead()}>
            <CheckCheck size={20} color="#4f46e5" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              className="p-4 mb-3 rounded-2xl flex-row items-start border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
            >
              <Skeleton className="w-8 h-8 rounded-full mr-3" />
              <View className="flex-1">
                <Skeleton className="w-32 h-4 rounded-md mb-2" />
                <Skeleton className="w-full h-3 rounded-md mb-1" />
                <Skeleton className="w-3/4 h-3 rounded-md mb-2" />
                <Skeleton className="w-16 h-2 rounded-md" />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={allNotifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleMarkRead(item)}
              className={`p-4 mb-3 rounded-2xl flex-row items-start border ${
                item.isRead
                  ? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                  : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800"
              }`}
            >
              <View className="mt-1 mr-3">
                <Bell size={20} color={item.isRead ? "#9ca3af" : "#4f46e5"} />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between mb-1">
                  <Text
                    className={`font-bold text-base ${item.isRead ? "text-gray-900 dark:text-white" : "text-indigo-900 dark:text-indigo-100"}`}
                  >
                    {item.title}
                  </Text>
                  {!item.isRead && (
                    <Circle
                      size={10}
                      fill="#4f46e5"
                      color="#4f46e5"
                      className="mt-1"
                    />
                  )}
                </View>
                <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  {item.message}
                </Text>
                <Text className="text-xs text-gray-400">
                  {formatRelativeTime(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              icon={<Bell size={48} color="#9ca3af" />}
              title="All caught up!"
              description="You have no new notifications right now."
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color="#4f46e5"
                className="mt-4"
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
