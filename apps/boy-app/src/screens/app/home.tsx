import { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, View, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

import { HomeHeader } from '../../components/home/HomeHeader';
import { WalletCard } from '../../components/home/WalletCard';
import { SearchBar } from '../../components/home/SearchBar';
import { SectionHeader } from '../../components/home/SectionHeader';
import { GirlAvatarCard, GirlDetailCard } from '../../components/home/GirlCards';
import { RecentChatCard } from '../../components/home/RecentChatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Users, Search } from 'lucide-react-native';

import { 
  useWalletSummary, 
  useOnlineGirls, 
  useRecommendedGirls, 
  useRecentChats 
} from '../../hooks/useHomeData';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: wallet, isLoading: isLoadingWallet } = useWalletSummary();
  const { data: onlineGirls, isLoading: isLoadingOnline } = useOnlineGirls();
  const { data: recommendedGirls, isLoading: isLoadingRec } = useRecommendedGirls();
  const { data: recentChats } = useRecentChats();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['walletSummary'] }),
      queryClient.invalidateQueries({ queryKey: ['girls'] }),
      queryClient.invalidateQueries({ queryKey: ['recentChats'] })
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const renderHorizontalList = (
    data: any[], 
    isLoading: boolean, 
    CardComponent: React.ElementType, 
    emptyTitle: string, 
    emptyDesc: string,
    useGrid = false,
    emptyIcon?: React.ReactNode
  ) => {
    if (isLoading) {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`mr-4 ${useGrid ? 'w-[300px] h-32 rounded-2xl' : 'w-18 h-18 rounded-full'}`} />
          ))}
        </ScrollView>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View className="px-6 py-2">
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} />
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <CardComponent girl={item} chat={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={3}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <HomeHeader />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
      >
        {/* Wallet / Balance Banner */}
        <WalletCard wallet={wallet} isLoading={isLoadingWallet} />
        
        {/* Search Input Bar */}
        <SearchBar />

        {/* Recent Conversations (if available) */}
        {recentChats && recentChats.length > 0 && (
          <View className="mb-7">
            <SectionHeader 
              title="Recent Chats" 
              subtitle="Continue where you left off"
              actionText="View All" 
              onAction={() => navigation.navigate('Chats')} 
            />
            <FlatList
              data={recentChats}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <RecentChatCard chat={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
            />
          </View>
        )}

        {/* Online Now Stories */}
        <View className="mb-7">
          <SectionHeader 
            title="Online Now" 
            subtitle="Active creators ready to connect"
            actionText="See All" 
            onAction={() => navigation.navigate('Search')} 
          />
          {renderHorizontalList(
            onlineGirls || [], 
            isLoadingOnline, 
            GirlAvatarCard, 
            "No creators online", 
            "Check back in a moment to see who comes online.",
            false,
            <Users size={28} color="#9ca3af" />
          )}
        </View>

        {/* Recommended for You */}
        <View className="mb-7">
          <SectionHeader 
            title="Recommended for You" 
            subtitle="Top creators picked for you"
            actionText="Explore"
            onAction={() => navigation.navigate('Search')}
          />
          {renderHorizontalList(
            recommendedGirls || [], 
            isLoadingRec, 
            GirlDetailCard, 
            "No recommendations yet", 
            "We'll find great matches for you shortly.",
            true,
            <Search size={28} color="#9ca3af" />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
