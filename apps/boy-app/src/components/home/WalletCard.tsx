import { View, Text, TouchableOpacity } from "react-native";
import { Coins, Plus, TrendingUp } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { WalletSummary } from "../../api/homeApi";
import { Skeleton } from "../ui/Skeleton";

interface WalletCardProps {
  wallet?: WalletSummary;
  isLoading: boolean;
}

export function WalletCard({ wallet, isLoading }: WalletCardProps) {
  const navigation = useNavigation<any>();

  return (
    <View className="px-6 mb-6">
      <View className="bg-indigo-600 rounded-3xl p-6">
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-indigo-200 font-medium mb-1">
              Available Balance
            </Text>
            {isLoading ? (
              <Skeleton className="w-32 h-8 rounded-lg bg-indigo-500/50" />
            ) : (
              <View className="flex-row items-center">
                <Coins size={28} color="#f59e0b" className="mr-2" />
                <Text className="text-3xl font-extrabold text-white">
                  {wallet?.currentBalance?.toLocaleString() || "0"}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Recharge")}
            className="bg-white/20 px-4 py-2 rounded-full flex-row items-center"
          >
            <Plus size={16} color="#ffffff" className="mr-1" />
            <Text className="text-white font-bold">Top Up</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-indigo-700/50 rounded-xl p-3">
          <TrendingUp size={16} color="#a5b4fc" className="mr-2" />
          <Text className="text-indigo-200 text-xs flex-1">
            Lifetime recharge:{" "}
            <Text className="font-bold text-white">
              ₹{wallet?.lifetimeRecharge?.toLocaleString() || "0"}
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
