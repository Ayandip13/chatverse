import { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { SendHorizontal, Smile } from 'lucide-react-native';

export function ChatInput({ onSend, onTyping }: { onSend: (text: string) => void, onTyping: (isTyping: boolean) => void }) {
  const [text, setText] = useState('');

  const handleChange = (val: string) => {
    setText(val);
    onTyping(val.length > 0);
  };

  const handleSend = () => {
    if (text.trim().length === 0) return;
    onSend(text.trim());
    setText('');
    onTyping(false);
  };

  return (
    <View className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex-row items-end">
      <TouchableOpacity className="p-2 mr-2">
        <Smile size={24} color="#6b7280" />
      </TouchableOpacity>
      
      <View className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-2 min-h-[44px] max-h-24 justify-center">
        <TextInput
          className="text-gray-900 dark:text-white text-base max-h-24"
          placeholder="Message..."
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
          text.trim().length > 0 ? 'bg-indigo-600 shadow-md shadow-indigo-500/30' : 'bg-gray-200 dark:bg-gray-800'
        }`}
      >
        <SendHorizontal size={20} color={text.trim().length > 0 ? "#ffffff" : "#9ca3af"} />
      </TouchableOpacity>
    </View>
  );
}
