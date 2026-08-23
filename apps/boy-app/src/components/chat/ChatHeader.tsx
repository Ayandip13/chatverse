import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { ArrowLeft, MoreVertical, Star, ShieldCheck, PhoneOff, User, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ChatDetails } from '../../api/messagingApi';
import { getAvatarUrl } from '../../utils/avatarUtil';

interface ChatHeaderProps {
  chat: ChatDetails;
  onRate?: () => void;
  onEndChat?: () => void;
}

export function ChatHeader({ chat, onRate, onEndChat }: ChatHeaderProps) {
  const navigation = useNavigation<any>();
  const [showMenu, setShowMenu] = useState(false);

  const handleEndChatPress = () => {
    setShowMenu(false);
    Alert.alert(
      'End Chat Session',
      'Are you sure you want to end this chat session now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Chat',
          style: 'destructive',
          onPress: () => {
            if (onEndChat) {
              onEndChat();
            }
          },
        },
      ]
    );
  };

  const handleViewProfilePress = () => {
    setShowMenu(false);
    if (chat.otherParticipant?._id) {
      navigation.navigate('GirlDetailScreen', { id: chat.otherParticipant._id });
    }
  };

  const handleRatePress = () => {
    setShowMenu(false);
    if (onRate) {
      onRate();
    }
  };

  return (
    <View className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xs">
      <View className="flex-row items-center px-4 py-3 justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2 p-1.5 rounded-full active:bg-gray-100 dark:active:bg-gray-800">
            <View className="items-center justify-center">
              <ArrowLeft size={22} color="#374151" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleViewProfilePress} 
            className="flex-row items-center flex-1"
            activeOpacity={0.8}
          >
            <View className="relative w-12 h-12 rounded-full p-0.5 border-2 border-indigo-500 mr-3 items-center justify-center bg-gray-100 dark:bg-gray-800">
              <View className="w-full h-full rounded-full overflow-hidden">
                <Image 
                  source={{ uri: getAvatarUrl(chat.otherParticipant?.avatar, chat.otherParticipant?.name, chat.otherParticipant?._id) }} 
                  className="w-full h-full rounded-full"
                  style={{ borderRadius: 9999 }}
                />
              </View>
              {chat.otherParticipant?.isOnline && (
                <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="font-extrabold text-gray-900 dark:text-white text-base mr-1" numberOfLines={1}>
                  {chat.otherParticipant?.name || 'User'}
                </Text>
                <View className="items-center justify-center">
                  <ShieldCheck size={14} color="#3b82f6" />
                </View>
              </View>
              <Text className={`text-xs font-semibold ${chat.otherParticipant?.isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
                {chat.otherParticipant?.isOnline ? 'Active Now' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          {onRate && (
            <TouchableOpacity 
              onPress={onRate} 
              className="px-2.5 py-1.5 mr-2 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/40 flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="mr-1 items-center justify-center">
                <Star size={14} color="#f59e0b" fill="#fbbf24" />
              </View>
              <Text className="text-xs font-black text-amber-700 dark:text-amber-400">Rate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => setShowMenu(true)} 
            className="p-1.5 rounded-full active:bg-gray-100 dark:active:bg-gray-800"
            activeOpacity={0.7}
          >
            <View className="items-center justify-center">
              <MoreVertical size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3-Dots Action Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View className="flex-1 bg-black/50 justify-end sm:justify-center items-center px-4 pb-6 sm:pb-0">
            <TouchableWithoutFeedback>
              <View className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                  <Text className="text-base font-bold text-gray-900 dark:text-white">Chat Options</Text>
                  <TouchableOpacity onPress={() => setShowMenu(false)} className="p-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    <X size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {/* Option 1: End Chat Session */}
                {chat.status === 'ACTIVE' && onEndChat && (
                  <TouchableOpacity
                    onPress={handleEndChatPress}
                    className="flex-row items-center py-3.5 px-3 rounded-2xl active:bg-rose-50 dark:active:bg-rose-950/40 my-1"
                  >
                    <View className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 items-center justify-center mr-3">
                      <PhoneOff size={18} color="#ef4444" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-rose-600 dark:text-rose-400">End Chat Session</Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stop session & save coins</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Option 2: View Profile */}
                <TouchableOpacity
                  onPress={handleViewProfilePress}
                  className="flex-row items-center py-3.5 px-3 rounded-2xl active:bg-gray-50 dark:active:bg-gray-700/50 my-1"
                >
                  <View className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/40 items-center justify-center mr-3">
                    <User size={18} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white">View Profile</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">See photos, bio & ratings</Text>
                  </View>
                </TouchableOpacity>

                {/* Option 3: Rate Creator */}
                {onRate && (
                  <TouchableOpacity
                    onPress={handleRatePress}
                    className="flex-row items-center py-3.5 px-3 rounded-2xl active:bg-amber-50 dark:active:bg-amber-950/40 my-1"
                  >
                    <View className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 items-center justify-center mr-3">
                      <Star size={18} color="#f59e0b" fill="#fbbf24" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-amber-700 dark:text-amber-400">Rate Creator</Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Leave feedback & review</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Cancel */}
                <TouchableOpacity
                  onPress={() => setShowMenu(false)}
                  className="mt-3 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700/60 items-center"
                >
                  <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
