import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
} from 'react-native';
import {
  SendHorizontal,
  Smile,
  Image as ImageIcon,
  X,
  CornerDownRight,
} from 'lucide-react-native';
import { Message } from '../../api/messagingApi';

const QUICK_EMOJIS = [
  '❤️',
  '🔥',
  '👍',
  '😂',
  '😍',
  '🎉',
  '💯',
  '✨',
  '🙏',
  '😊',
];

interface ChatInputProps {
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

export function ChatInput({
  onSend,
  onTyping,
  replyingTo,
  onCancelReply,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const handleChange = (val: string) => {
    setText(val);
    onTyping(val.length > 0);
  };

  const handleSend = () => {
    if (text.trim().length === 0) return;

    let finalContent = text.trim();

    if (replyingTo) {
      const quoteExcerpt = replyingTo.content
        .replace(/^\[(IMAGE|REPLY):.*?\]:/, '')
        .substring(0, 50);

      finalContent = `[REPLY:${quoteExcerpt}]:${finalContent}`;

      onCancelReply?.();
    }

    onSend(finalContent);
    setText('');
    onTyping(false);
    setShowEmojiPicker(false);
  };

  const handleSendImage = () => {
    if (!imageUrlInput.trim() || !imageUrlInput.startsWith('http')) {
      Alert.alert(
        'Invalid URL',
        'Please enter a valid HTTP/HTTPS image URL.'
      );
      return;
    }

    onSend(`[IMAGE]:${imageUrlInput.trim()}`);
    setImageUrlInput('');
    setShowImageModal(false);
  };

  const addEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    onTyping(true);
  };

  return (
    <View className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      {replyingTo && (
        <View
          className="px-4 py-2 bg-indigo-50 flex-row items-center justify-between border-b border-indigo-100 dark:border-indigo-800"
          style={{
            backgroundColor: 'rgba(49,46,129,0.3)',
          }}
        >
          <View className="flex-row items-center gap-2 flex-1">
            <CornerDownRight size={16} color="#6366f1" />

            <View className="flex-1">
              <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Replying to Message
              </Text>

              <Text
                className="text-xs text-gray-600 dark:text-gray-300"
                numberOfLines={1}
              >
                {replyingTo.content}
              </Text>
            </View>
          </View>

          {onCancelReply && (
            <TouchableOpacity
              onPress={onCancelReply}
              className="p-1 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <X size={14} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {showEmojiPicker && (
        <View className="px-4 py-2 bg-gray-50 dark:bg-gray-800 flex-row justify-around border-b border-gray-100 dark:border-gray-700">
          {QUICK_EMOJIS.map((emoji, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => addEmoji(emoji)}
              className="p-1"
            >
              <Text className="text-xl">{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View className="px-4 py-3 flex-row items-end">
        <TouchableOpacity
          onPress={() => setShowEmojiPicker(prev => !prev)}
          className="p-2 mr-1"
        >
          <Smile
            size={24}
            color={showEmojiPicker ? '#6366f1' : '#6b7280'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowImageModal(true)}
          className="p-2 mr-2"
        >
          <ImageIcon size={24} color="#6b7280" />
        </TouchableOpacity>

        <View className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-2 min-h-[44px] max-h-24 justify-center border border-gray-200 dark:border-gray-700">
          <TextInput
            className="text-gray-900 dark:text-white text-base max-h-24"
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={handleChange}
            multiline
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={text.trim().length === 0}
          className={`ml-3 w-11 h-11 rounded-full items-center justify-center ${
            text.trim().length > 0
              ? 'bg-indigo-600'
              : 'bg-gray-200 dark:bg-gray-800'
          }`}
          style={
            text.trim().length > 0
              ? {
                  shadowColor: '#6366f1',
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 5,
                }
              : undefined
          }
        >
          <SendHorizontal
            size={20}
            color={text.trim().length > 0 ? '#ffffff' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showImageModal}
        transparent
        animationType="slide"
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        >
          <View
            className="bg-white dark:bg-gray-800 w-full p-6 rounded-3xl border border-gray-100 dark:border-gray-700"
            style={{
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 8,
              },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Share Image
              </Text>

              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                className="p-1 rounded-full bg-gray-100 dark:bg-gray-700"
              >
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
              placeholder="Paste Image HTTP/HTTPS URL..."
              placeholderTextColor="#9ca3af"
              className="w-full bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 h-12 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm mb-6 font-mono"
            />

            <TouchableOpacity
              onPress={handleSendImage}
              className="w-full bg-indigo-600 py-3.5 rounded-2xl items-center"
              style={{
                shadowColor: '#6366f1',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 5,
              }}
            >
              <Text className="text-white font-bold text-base">
                Send Image
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}