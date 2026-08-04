import { View, Text, Image, TouchableOpacity } from "react-native";
import { formatRelativeTime } from "../../utils/date";
import { ChatRequest } from "../../api/messagingApi";
import { CheckCircle2, XCircle, Clock } from "lucide-react-native";
import { getAvatarUrl } from "../../utils/avatarUtil";

export function ChatRequestCard({
  request,
  onCancel,
}: {
  request: ChatRequest;
  onCancel: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "text-green-500";
      case "REJECTED":
        return "text-red-500";
      case "CANCELLED":
        return "text-gray-500";
      default:
        return "text-amber-500";
    }
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-gray-700 flex-row items-center">
      <Image
        source={{
          uri: getAvatarUrl(
            request.targetUser?.avatar,
            request.targetUser?.name,
            request.targetUser?._id,
          ),
        }}
        className="w-14 h-14 rounded-full mr-4"
      />
      <View className="flex-1">
        <View className="flex-row justify-between mb-1">
          <Text className="font-bold text-gray-900 dark:text-white text-base">
            {request.targetUser?.name || "Unknown User"}
          </Text>
          <Text className="text-xs text-gray-400">
            {formatRelativeTime(request.createdAt)}
          </Text>
        </View>
        <Text className={`text-xs font-bold ${getStatusColor(request.status)}`}>
          {request.status}
        </Text>
      </View>

      {request.status === "PENDING" && (
        <TouchableOpacity
          onPress={onCancel}
          className="ml-3 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-800"
        >
          <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
            Cancel
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
