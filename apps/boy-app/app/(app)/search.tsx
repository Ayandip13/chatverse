import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, ArrowLeft, SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSearchGirls } from '../../src/hooks/useDiscovery';
import { GirlDetailCard } from '../../src/components/home/GirlCards';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Skeleton } from '../../src/components/ui/Skeleton';

export default function SearchScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ online: false, popular: false, recommended: false });

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setTimeout(() => setDebouncedSearch(text), 500);
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching
  } = useSearchGirls({ 
    search: debouncedSearch || undefined,
    online: filters.online || undefined,
    popular: filters.popular || undefined,
    recommended: filters.recommended || undefined
  });

  const allGirls = data?.pages.flat() || [];

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center bg-white dark:bg-gray-800 rounded-2xl px-4 border border-gray-200 dark:border-gray-700 h-12">
          <SearchIcon size={20} color="#9ca3af" className="mr-2" />
          <TextInput
            className="flex-1 text-gray-900 dark:text-white"
            placeholder="Search for girls..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>
      </View>

      <View className="px-6 mb-4 flex-row items-center space-x-3">
        <SlidersHorizontal size={20} color="#6b7280" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 ml-2">
          {['online', 'popular', 'recommended'].map(filterKey => (
            <TouchableOpacity 
              key={filterKey}
              onPress={() => toggleFilter(filterKey as keyof typeof filters)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${
                filters[filterKey as keyof typeof filters] 
                  ? 'bg-indigo-600 border-indigo-600' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filters[filterKey as keyof typeof filters] ? 'text-white' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-row flex-wrap justify-between px-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-[47%] h-64 rounded-2xl mb-4" />)}
        </View>
      ) : (
        <FlatList
          data={allGirls}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          renderItem={({ item }) => <View className="w-[48%]"><GirlDetailCard girl={item} /></View>}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState 
              title="No matches found" 
              description="Try adjusting your filters or search term." 
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator size="small" color="#4f46e5" className="mt-4" /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}
