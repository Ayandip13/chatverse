import { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

import { HomeHeader } from '../../components/home/HomeHeader';
import { WalletCard } from '../../components/home/WalletCard';
import { SearchBar } from '../../components/home/SearchBar';
import { QuickActions } from '../../components/home/QuickActions';
import { PromotionalCarousel } from '../../components/home/PromotionalCarousel';
import { SectionHeader } from '../../components/home/SectionHeader';
import { GirlAvatarCard, GirlDetailCard } from '../../components/home/GirlCards';
import { RecentChatCard } from '../../components/home/RecentChatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Users, Search, MessageCircle, Star, UserPlus } from 'lucide-react-native';

import { 
  useWalletSummary, 
  useOnlineGirls, 
  useRecommendedGirls, 
  usePopularGirls, 
  useRecentlyJoinedGirls, 
  useRecentChats 
} from '../../hooks/useHomeData';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: wallet, isLoading: isLoadingWallet } = useWalletSummary();
  const { data: onlineGirls, isLoading: isLoadingOnline } = useOnlineGirls();
  const { data: recommendedGirls, isLoading: isLoadingRec } = useRecommendedGirls();
  const { data: popularGirls, isLoading: isLoadingPop } = usePopularGirls();
  const { data: recentGirls, isLoading: isLoadingRecent } = useRecentlyJoinedGirls();
  const { data: recentChats, isLoading: isLoadingChats } = useRecentChats();

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
            <Skeleton key={i} className={`mr-4 ${useGrid ? 'w-40 h-64 rounded-2xl' : 'w-16 h-16 rounded-full'}`} />
          ))}
        </ScrollView>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View className="px-6 py-4">
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
        initialNumToRender={4}
        maxToRenderPerBatch={4}
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
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
      >
        <WalletCard wallet={wallet} isLoading={isLoadingWallet} />
        
        <SearchBar />
        
        <QuickActions />
        
        <PromotionalCarousel />

        <View className="mb-8">
          <SectionHeader title="Online Now" actionText="See All" onAction={() => navigation.navigate('Search')} />
          {renderHorizontalList(
            onlineGirls || [], 
            isLoadingOnline, 
            GirlAvatarCard, 
            "No one's online", 
            "Check back later to see who's online.",
            false,
            <Users size={32} color="#9ca3af" />
          )}
        </View>

        <View className="mb-8">
          <SectionHeader title="Recommended for You" />
          {renderHorizontalList(
            recommendedGirls || [], 
            isLoadingRec, 
            GirlDetailCard, 
            "No recommendations", 
            "We'll find matches for you soon.",
            true,
            <Search size={32} color="#9ca3af" />
          )}
        </View>



      </ScrollView>
    </SafeAreaView>
  );
}
