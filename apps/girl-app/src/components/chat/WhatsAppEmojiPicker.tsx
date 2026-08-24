import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Delete } from 'lucide-react-native';
import { EMOJI_CATEGORIES } from '../../constants/emojis';

interface WhatsAppEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onDelete?: () => void;
  themeColor?: string;
}

export function WhatsAppEmojiPicker({
  onSelectEmoji,
  onDelete,
  themeColor = '#ec4899',
}: WhatsAppEmojiPickerProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(EMOJI_CATEGORIES[0].id);

  const activeCategory =
    EMOJI_CATEGORIES.find((cat) => cat.id === activeCategoryId) || EMOJI_CATEGORIES[0];

  return (
    <View className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      {/* Category Tabs Bar */}
      <View className="flex-row items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 px-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 py-1.5">
          {EMOJI_CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategoryId(cat.id)}
                className={`px-3 py-1.5 mr-1 rounded-full flex-row items-center gap-1 ${
                  isActive
                    ? 'bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800'
                    : 'bg-transparent'
                }`}
                activeOpacity={0.7}
              >
                <Text className="text-base">{cat.icon}</Text>
                {isActive && (
                  <Text className="text-xs font-bold text-pink-600 dark:text-pink-400">
                    {cat.name.split(' ')[0]}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Backspace Button */}
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            className="p-2 ml-1 rounded-full bg-slate-100 dark:bg-slate-700 active:bg-slate-200"
            activeOpacity={0.7}
          >
            <Delete size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Emoji Grid Scroll View */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="h-56 p-2"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <Text className="text-[11px] font-bold text-slate-400 dark:text-slate-400 px-2 mb-1.5 uppercase tracking-wider">
          {activeCategory.name}
        </Text>
        <View className="flex-row flex-wrap justify-start">
          {activeCategory.emojis.map((emoji, index) => (
            <TouchableOpacity
              key={`${activeCategory.id}-${index}`}
              onPress={() => onSelectEmoji(emoji)}
              className="w-[12.5%] h-11 items-center justify-center rounded-xl active:bg-slate-200 dark:active:bg-slate-700"
              activeOpacity={0.5}
            >
              <Text className="text-2xl">{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
