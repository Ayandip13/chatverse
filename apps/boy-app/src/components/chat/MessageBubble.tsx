import { View, Text } from 'react-native';
import { Message } from '../../api/messagingApi';

const formatTime = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function MessageBubble({ message, isOwnMessage }: { message: Message, isOwnMessage: boolean }) {
  return (
    <View className={`mb-4 w-full flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <View 
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isOwnMessage 
            ? 'bg-indigo-600 rounded-tr-sm' 
            : 'bg-white dark:bg-gray-800 rounded-tl-sm border border-gray-100 dark:border-gray-700 shadow-sm shadow-gray-100 dark:shadow-none'
        }`}
      >
        <Text className={`text-base leading-relaxed ${isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
          {message.content}
        </Text>
        <Text className={`text-[10px] mt-1 text-right ${isOwnMessage ? 'text-indigo-200' : 'text-gray-400'}`}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}
