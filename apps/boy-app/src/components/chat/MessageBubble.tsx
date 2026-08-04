import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Modal } from "react-native";
import { Check, CheckCheck, Reply, X } from "lucide-react-native";
import { Message } from "../../api/messagingApi";

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

interface MessageBubbleProps {
  message: Message & {
    status?: "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  };
  isOwnMessage: boolean;
  onReply?: (message: Message) => void;
}

export function MessageBubble({
  message,
  isOwnMessage,
  onReply,
}: MessageBubbleProps) {
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const rawContent = message.content || "";
  const isImage = rawContent.startsWith("[IMAGE]:");
  const isReply = rawContent.startsWith("[REPLY:");

  let imageUrl = "";
  if (isImage) {
    imageUrl = rawContent.replace("[IMAGE]:", "").trim();
  }

  let quotedText = "";
  let actualBody = rawContent;

  if (isReply) {
    const endQuoteIdx = rawContent.indexOf("]:");
    if (endQuoteIdx !== -1) {
      quotedText = rawContent.substring(7, endQuoteIdx);
      actualBody = rawContent.substring(endQuoteIdx + 2);
    }
  }

  return (
    <View
      className={`mb-3 w-full flex-row ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <View
        className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
          isOwnMessage
            ? "bg-indigo-600 rounded-tr-xs"
            : "bg-white dark:bg-gray-800 rounded-tl-xs border border-gray-100 dark:border-gray-700"
        }`}
      >
        {/* Reply Action Header if onReply provided */}
        {onReply && !isOwnMessage && (
          <TouchableOpacity
            onPress={() => onReply(message)}
            className="self-end mb-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-full opacity-60"
          >
            <Reply size={12} color="#6366f1" />
          </TouchableOpacity>
        )}

        {/* Quoted Reply Banner */}
        {isReply && (
          <View
            className={`p-2.5 rounded-xl mb-2 border-l-4 ${
              isOwnMessage
                ? "bg-indigo-700/60 border-indigo-300"
                : "bg-gray-100 dark:bg-gray-700/60 border-indigo-500"
            }`}
          >
            <Text
              className={`text-xs font-bold ${isOwnMessage ? "text-indigo-200" : "text-indigo-600 dark:text-indigo-400"}`}
            >
              Replying to
            </Text>
            <Text
              className={`text-xs italic mt-0.5 ${isOwnMessage ? "text-indigo-100" : "text-gray-600 dark:text-gray-300"}`}
              numberOfLines={2}
            >
              "{quotedText}"
            </Text>
          </View>
        )}

        {/* Image Message Body */}
        {isImage ? (
          <TouchableOpacity
            onPress={() => setImageModalUrl(imageUrl)}
            className="rounded-xl overflow-hidden mb-1"
          >
            <Image
              source={{ uri: imageUrl }}
              className="w-56 h-56 rounded-xl bg-gray-200"
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          /* Text / Emoji Message Body */
          <Text
            className={`text-base leading-relaxed ${isOwnMessage ? "text-white font-medium" : "text-gray-900 dark:text-gray-100"}`}
          >
            {actualBody}
          </Text>
        )}

        {/* Footer: Timestamp & Read/Delivery Checkmarks */}
        <View className="flex-row items-center justify-end gap-1 mt-1">
          <Text
            className={`text-[10px] ${isOwnMessage ? "text-indigo-200" : "text-gray-400"}`}
          >
            {formatTime(message.createdAt)}
          </Text>

          {isOwnMessage && (
            <View className="ml-1">
              {message.status === "READ" ? (
                <CheckCheck size={14} color="#60a5fa" />
              ) : (
                <Check size={14} color="#a5b4fc" />
              )}
            </View>
          )}
        </View>
      </View>

      {/* Expandable Image Modal */}
      <Modal visible={!!imageModalUrl} transparent animationType="fade">
        <View className="flex-1 bg-black/90 items-center justify-center p-4">
          <TouchableOpacity
            onPress={() => setImageModalUrl(null)}
            className="absolute top-12 right-6 p-3 bg-white/20 rounded-full"
          >
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          {imageModalUrl && (
            <Image
              source={{ uri: imageModalUrl }}
              className="w-full h-4/5 rounded-2xl"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
