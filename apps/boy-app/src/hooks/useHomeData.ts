import { useQuery } from '@tanstack/react-query';
import { fetchWalletSummary, fetchDiscoveryGirls, fetchRecentChats } from '../api/homeApi';

export const useWalletSummary = () => {
  return useQuery({
    queryKey: ['walletSummary'],
    queryFn: fetchWalletSummary,
    staleTime: 60000, // 1 minute
  });
};

export const useOnlineGirls = () => {
  return useQuery({
    queryKey: ['girls', 'online'],
    queryFn: () => fetchDiscoveryGirls({ online: true, limit: 10 }),
    staleTime: 30000,
  });
};

export const useRecommendedGirls = () => {
  return useQuery({
    queryKey: ['girls', 'recommended'],
    queryFn: () => fetchDiscoveryGirls({ recommended: true, limit: 5 }),
    staleTime: 5 * 60000,
  });
};

export const usePopularGirls = () => {
  return useQuery({
    queryKey: ['girls', 'popular'],
    queryFn: () => fetchDiscoveryGirls({ popular: true, limit: 10 }),
    staleTime: 5 * 60000,
  });
};

export const useRecentlyJoinedGirls = () => {
  return useQuery({
    queryKey: ['girls', 'recentlyJoined'],
    queryFn: () => fetchDiscoveryGirls({ recentlyJoined: true, limit: 10 }),
    staleTime: 5 * 60000,
  });
};

export const useRecentChats = () => {
  return useQuery({
    queryKey: ['recentChats'],
    queryFn: fetchRecentChats,
    staleTime: 30000,
  });
};
