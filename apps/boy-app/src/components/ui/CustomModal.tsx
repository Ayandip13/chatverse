import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: 'danger' | 'info' | 'success';
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'danger',
}) => {
  const getConfirmButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500 shadow-red-500/30';
      case 'success':
        return 'bg-green-500 shadow-green-500/30';
      case 'info':
      default:
        return 'bg-indigo-600 shadow-indigo-500/30';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="bg-white dark:bg-slate-800 w-full p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700">
          <Text className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 text-center">
            {title}
          </Text>
          
          <Text className="text-slate-500 dark:text-slate-400 text-center mb-8 leading-relaxed text-base">
            {message}
          </Text>

          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={onCancel}
              disabled={isLoading}
              className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-2xl items-center flex-row justify-center"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-bold text-base">{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isLoading}
              className={`flex-1 ${getConfirmButtonColor()} py-4 rounded-2xl items-center flex-row justify-center shadow-lg`}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
