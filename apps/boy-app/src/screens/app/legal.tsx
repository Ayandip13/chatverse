import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/types';

export default function LegalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppStackParamList, 'Legal'>>();
  const { type } = route.params;

  const title = type === 'privacy' ? 'Privacy Policy' : type === 'about' ? 'About App' : 'Terms & Conditions';
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <View className="flex-row items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">{title}</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">1. Introduction</Text>
        <Text className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Welcome to ChatVerse. These terms govern your use of our platform. By accessing the app, you agree to comply with our community guidelines and policies.
        </Text>

        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">2. User Conduct</Text>
        <Text className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          You agree not to engage in any prohibited activities, including but not limited to sharing inappropriate content, harassment, or violating local laws.
        </Text>

        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">3. Data Usage</Text>
        <Text className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
          Your privacy is important to us. We securely encrypt all messages and do not share your personal information with third-party advertisers without explicit consent.
        </Text>

        {type === 'about' && (
          <View className="items-center mt-8">
            <Text className="text-gray-400 text-sm">Version 1.0.0 (Build 42)</Text>
            <Text className="text-gray-400 text-sm mt-1">© 2026 ChatVerse Platform.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
