import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Star, X } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { Button } from '../ui/Button';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (score: number, review?: string) => Promise<void>;
  targetName: string;
}

export function RatingModal({ visible, onClose, onSubmit, targetName }: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(score, review.trim() || undefined);
      // Reset after success
      setScore(0);
      setReview('');
      onClose();
    } catch (error: any) {
      // Allow parent to handle or display error here
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white dark:bg-gray-800 w-full rounded-3xl p-6 shadow-xl relative">
          
          <TouchableOpacity 
            onPress={onClose} 
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700"
          >
            <X size={20} color={theme.colors.text.muted.light} />
          </TouchableOpacity>

          <View className="items-center mb-6 mt-4">
            <Text className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
              Rate {targetName}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center px-4">
              How was your chat? Your feedback helps others!
            </Text>
          </View>

          <View className="flex-row justify-center space-x-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity 
                key={star} 
                onPress={() => setScore(star)}
                activeOpacity={0.7}
                className="p-1"
              >
                <Star 
                  size={44} 
                  color={star <= score ? '#fbbf24' : '#e5e7eb'} 
                  fill={star <= score ? '#fbbf24' : 'transparent'} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Review (Optional)
            </Text>
            <TextInput
              value={review}
              onChangeText={setReview}
              placeholder="What did you like about the chat?"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-gray-900 dark:text-white min-h-[100px]"
            />
          </View>

          <Button 
            onPress={handleSubmit} 
            isLoading={loading}
            disabled={score === 0}
            className="w-full"
          >
            Submit Rating
          </Button>

        </View>
      </View>
    </Modal>
  );
}
