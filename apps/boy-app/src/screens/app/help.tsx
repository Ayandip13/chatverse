import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  MessageSquare,
  Mail,
  AlertTriangle,
  ExternalLink,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

export default function HelpScreen() {
  const navigation = useNavigation<any>();

  const handleEmailSupport = () => {
    Linking.openURL(
      "mailto:support@chatverse.com?subject=App%20Support%20Request",
    );
  };

  const faqs = [
    {
      q: "How do I recharge my wallet?",
      a: 'Go to your Profile and tap "My Wallet". You can recharge using UPI, Cards, or Netbanking.',
    },
    {
      q: "Why did my chat end suddenly?",
      a: "Chats automatically end if your coin balance is depleted or if the network connection drops for too long.",
    },
    {
      q: "How do I report a user?",
      a: 'Open the Chat or Girl Profile, tap the three dots or shield icon at the top, and select "Report User".',
    },
  ];

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      edges={["top"]}
    >
      <View className="flex-row items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          Help & Support
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Methods */}
        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-2 mb-3">
          Contact Us
        </Text>
        <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-8 border border-gray-100 dark:border-gray-700">
          <TouchableOpacity
            onPress={handleEmailSupport}
            className="flex-row items-center px-4 py-4 border-b border-gray-50 dark:border-gray-700/50"
          >
            <View className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center mr-4">
              <Mail size={20} color="#4f46e5" />
            </View>
            <Text className="flex-1 text-base font-semibold text-gray-800 dark:text-gray-200">
              Email Support
            </Text>
            <ExternalLink size={16} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-50 dark:border-gray-700/50">
            <View className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 items-center justify-center mr-4">
              <MessageSquare size={20} color="#10b981" />
            </View>
            <Text className="flex-1 text-base font-semibold text-gray-800 dark:text-gray-200">
              Live Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-4">
            <View className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 items-center justify-center mr-4">
              <AlertTriangle size={20} color="#d97706" />
            </View>
            <Text className="flex-1 text-base font-semibold text-gray-800 dark:text-gray-200">
              Report a Bug
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-2 mb-3">
          Frequently Asked Questions
        </Text>
        <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 pb-2">
          {faqs.map((faq, idx) => (
            <View
              key={idx}
              className={`px-4 py-4 ${idx !== faqs.length - 1 ? "border-b border-gray-50 dark:border-gray-700/50" : ""}`}
            >
              <Text className="text-base font-bold text-gray-900 dark:text-white mb-2">
                {faq.q}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {faq.a}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
