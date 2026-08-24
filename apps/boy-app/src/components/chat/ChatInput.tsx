import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  SendHorizontal,
  Smile,
  Image as ImageIcon,
  X,
  CornerDownRight,
  Upload,
  Mic,
  Trash2,
} from 'lucide-react-native';
import { useAudioRecorder, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/apiClient';
import { Message } from '../../api/messagingApi';
import { parseMessageContent, formatQuoteExcerpt } from '../../utils/messageUtil';
import { ImageEditorModal } from './ImageEditorModal';
import { WhatsAppEmojiPicker } from './WhatsAppEmojiPicker';

const QUICK_EMOJIS = [
  '❤️',
  '🔥',
  '👍',
  '😂',
  '😍',
  '🎉',
  '💯',
  '✨',
  '🙌',
  '👏',
  '🙏',
  '🥰',
  '😎',
  '🤔',
  '😊',
  '😘',
  '💋',
  '🌹',
  '🥂',
  '💎',
  '👑',
];

interface ChatInputProps {
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  bottomInset?: number;
}

export function ChatInput({
  onSend,
  onTyping,
  replyingTo,
  onCancelReply,
  bottomInset = 0,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [editorImageUri, setEditorImageUri] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioRecorder.stop().catch(() => {});
    };
  }, []);

  const handleChange = (val: string) => {
    setText(val);
    onTyping(val.length > 0);
  };

  const handleSend = () => {
    if (text.trim().length === 0) return;

    let finalContent = text.trim();

    if (replyingTo) {
      const quoteExcerpt = formatQuoteExcerpt(replyingTo.content);

      finalContent = `[REPLY:${quoteExcerpt}]:${finalContent}`;

      onCancelReply?.();
    }

    onSend(finalContent);
    setText('');
    onTyping(false);
    setShowEmojiPicker(false);
  };

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required to record voice notes.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('Error starting voice recording:', error);
      Alert.alert('Recording Error', 'Could not start audio recording.');
    }
  };

  const cancelRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    try {
      await audioRecorder.stop();
    } catch (e) {}

    await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const stopAndSendRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    try {
      setIsUploading(true);
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});

      const uri = audioRecorder.uri;
      const duration = recordingDuration;
      setIsRecording(false);
      setRecordingDuration(0);

      if (!uri) {
        Alert.alert('Recording Failed', 'Could not retrieve voice recording.');
        setIsUploading(false);
        return;
      }

      const filename = uri.split('/').pop() || `voice_${Date.now()}.m4a`;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type: 'audio/m4a',
      } as any);

      const response = await apiClient.post('/chats/upload', formData, {
        transformRequest: (data) => data,
        headers: { 'Accept': 'application/json' },
      });

      const uploadedUrl = response.data?.data?.url;
      if (uploadedUrl) {
        onSend(`[VOICE:${duration}]:${uploadedUrl}`);
      } else {
        Alert.alert('Upload Failed', 'Could not retrieve uploaded audio URL.');
      }
    } catch (error: any) {
      console.error('Error sending voice message:', error);
      Alert.alert('Upload Error', error?.response?.data?.message || error.message || 'Failed to send voice note.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickAndSendImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access gallery is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setShowImageModal(false);
        setEditorImageUri(result.assets[0].uri);
        setShowImageEditor(true);
      }
    } catch (error: any) {
      console.error('Error picking/uploading chat image:', error);
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to upload image from gallery');
    }
  };

  const handleSendEditedImage = async (finalUri: string, imageCaption: string) => {
    try {
      setIsUploading(true);
      const filename = finalUri.split('/').pop() || 'chat_image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: finalUri,
        name: filename,
        type,
      } as any);

      const response = await apiClient.post('/chats/upload', formData, {
        transformRequest: (data) => data,
        headers: { 'Accept': 'application/json' },
      });

      const uploadedUrl = response.data?.data?.url;
      if (uploadedUrl) {
        setShowImageEditor(false);
        setEditorImageUri(null);
        const payload = imageCaption ? `[IMAGE]:${uploadedUrl}\n${imageCaption}` : `[IMAGE]:${uploadedUrl}`;
        onSend(payload);
      } else {
        Alert.alert('Upload Failed', 'Could not retrieve uploaded image URL.');
      }
    } catch (error: any) {
      console.error('Error uploading chat image:', error);
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendImageLink = () => {
    if (!imageUrlInput.trim() || !imageUrlInput.startsWith('http')) {
      Alert.alert(
        'Invalid URL',
        'Please enter a valid HTTP/HTTPS image URL.'
      );
      return;
    }

    const url = imageUrlInput.trim();
    setImageUrlInput('');
    setShowImageModal(false);
    setEditorImageUri(url);
    setShowImageEditor(true);
  };

  const addEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    onTyping(true);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const parsedReplying = replyingTo ? parseMessageContent(replyingTo.content) : null;

  return (
    <View 
      className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
      style={{ paddingBottom: bottomInset }}
    >
      {replyingTo && (
        <View
          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 flex-row items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40"
        >
          <View className="flex-row items-center gap-2 flex-1">
            <CornerDownRight size={16} color="#6366f1" />

            <View className="flex-1">
              <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Replying to Message
              </Text>

              {parsedReplying?.type === 'IMAGE' ? (
                <View className="flex-row items-center mt-0.5">
                  <View className="mr-1 items-center justify-center">
                    <ImageIcon size={12} color="#818cf8" />
                  </View>
                  <Text className="text-xs text-indigo-700 dark:text-indigo-300 font-medium" numberOfLines={1}>
                    Photo
                  </Text>
                </View>
              ) : parsedReplying?.type === 'VOICE' ? (
                <View className="flex-row items-center mt-0.5">
                  <View className="mr-1 items-center justify-center">
                    <Mic size={12} color="#818cf8" />
                  </View>
                  <Text className="text-xs text-indigo-700 dark:text-indigo-300 font-medium" numberOfLines={1}>
                    {parsedReplying.displayText}
                  </Text>
                </View>
              ) : (
                <Text
                  className="text-xs text-gray-600 dark:text-gray-300 mt-0.5"
                  numberOfLines={1}
                >
                  {parsedReplying?.displayText}
                </Text>
              )}
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
        <WhatsAppEmojiPicker
          onSelectEmoji={addEmoji}
          onDelete={() => {
            setText((prev) => Array.from(prev).slice(0, -1).join(''));
          }}
          themeColor="#6366f1"
        />
      )}

      {isRecording ? (
        /* Voice Recording Active Bar */
        <View className="px-4 py-3 flex-row items-center justify-between bg-rose-50 dark:bg-rose-950/40">
          <View className="flex-row items-center gap-3">
            <View className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
            <Text className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
              Recording... {formatTimer(recordingDuration)}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={cancelRecording}
              className="p-2.5 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={stopAndSendRecording}
              className="px-4 py-2.5 rounded-full bg-indigo-600 flex-row items-center gap-1.5 shadow-md shadow-indigo-500/30"
            >
              <SendHorizontal size={16} color="#ffffff" />
              <Text className="text-white font-bold text-xs">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Standard Message Input Bar */
        <View className="px-4 py-3 flex-row items-end">
          <TouchableOpacity
            onPress={() => setShowEmojiPicker(prev => !prev)}
            className="p-2 mr-1"
            activeOpacity={0.7}
          >
            <View className="items-center justify-center">
              <Smile
                size={22}
                color={showEmojiPicker ? '#6366f1' : '#6b7280'}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePickAndSendImage}
            disabled={isUploading}
            className="p-2 mr-2"
            activeOpacity={0.7}
          >
            <View className="items-center justify-center">
              {isUploading ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <ImageIcon size={22} color="#6b7280" />
              )}
            </View>
          </TouchableOpacity>

          <View className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-2 min-h-[44px] max-h-24 justify-center border border-gray-200 dark:border-gray-700">
            <TextInput
              className="text-gray-900 dark:text-white text-base max-h-24 font-medium"
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={text}
              onChangeText={handleChange}
              multiline
            />
          </View>

          {text.trim().length > 0 ? (
            <TouchableOpacity
              onPress={handleSend}
              className="ml-2.5 w-11 h-11 rounded-full items-center justify-center bg-indigo-600 active:bg-indigo-700 shadow-md shadow-indigo-500/30"
            >
              <View className="items-center justify-center ml-0.5">
                <SendHorizontal size={19} color="#ffffff" />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={startRecording}
              disabled={isUploading}
              className="ml-2.5 w-11 h-11 rounded-full items-center justify-center bg-indigo-600 active:bg-indigo-700 shadow-md shadow-indigo-500/30"
            >
              <View className="items-center justify-center">
                <Mic size={20} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}


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
                Send Image
              </Text>

              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                className="p-1 rounded-full bg-gray-100 dark:bg-gray-700"
              >
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Gallery Pick Option */}
            <TouchableOpacity
              onPress={handlePickAndSendImage}
              disabled={isUploading}
              className="w-full bg-indigo-600 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 mb-4"
              style={{
                shadowColor: '#6366f1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 5,
              }}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Upload size={18} color="#ffffff" />
                  <Text className="text-white font-bold text-base">
                    Choose from Gallery
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-2">
              <View className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-700" />
              <Text className="mx-3 text-xs text-gray-400 font-medium">OR PASTE LINK</Text>
              <View className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-700" />
            </View>

            <TextInput
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
              placeholder="Paste Image HTTP/HTTPS URL..."
              placeholderTextColor="#9ca3af"
              className="w-full bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 h-12 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm my-3 font-mono"
            />

            <TouchableOpacity
              onPress={handleSendImageLink}
              disabled={!imageUrlInput.trim()}
              className={`w-full py-3.5 rounded-2xl items-center ${
                imageUrlInput.trim() ? 'bg-gray-900 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-800'
              }`}
            >
              <Text className="text-white font-bold text-base">
                Send Image Link
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* WhatsApp-style Image Editor & Preview Modal */}
      <ImageEditorModal
        visible={showImageEditor}
        imageUri={editorImageUri}
        onClose={() => {
          setShowImageEditor(false);
          setEditorImageUri(null);
        }}
        onSend={handleSendEditedImage}
        isUploading={isUploading}
        themeColor="#6366f1"
      />
    </View>
  );
}