import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Heart } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../../hooks/useDiscovery";
import { GirlDetailCard } from "../../components/home/GirlCards";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const {
    data: favoriteGirls,
    isLoading,
    refetch,
    isRefetching,
  } = useFavorites();

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
          My Favorites
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-row flex-wrap justify-between px-6 py-6">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="w-[48%] mb-4">
              <Skeleton className="w-full h-56 rounded-3xl" />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={favoriteGirls || []}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: 16,
          }}
          renderItem={({ item }) => (
            <View className="w-[48%]">
              <GirlDetailCard girl={item} />
            </View>
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              icon={<Heart size={48} color="#9ca3af" />}
              title="No favorites yet"
              description="Girls you favorite will appear here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
