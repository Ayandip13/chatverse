import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDiscoveryGirls, fetchGirlDetails, toggleFavorite, GirlProfile } from '../api/homeApi';

export const useSearchGirls = (filters: Record<string, any>) => {
  return useInfiniteQuery({
    queryKey: ['girls', 'search', filters],
    queryFn: async ({ pageParam = 1 }) => {
      return fetchDiscoveryGirls({ ...filters, page: pageParam, limit: 20 });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length + 1 : undefined;
    },
    staleTime: 60000,
  });
};

export const useGirlDetails = (id: string) => {
  return useQuery({
    queryKey: ['girlDetails', id],
    queryFn: () => fetchGirlDetails(id),
    staleTime: 60000,
  });
};

export const useFavorites = () => {
  return useQuery({
    queryKey: ['girls', 'favorites'],
    queryFn: () => fetchDiscoveryGirls({ favorites: true, limit: 100 }),
    staleTime: 0, // Always fetch fresh to reflect recent toggles
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) => 
      toggleFavorite(id, isFavorite),
    onMutate: async ({ id, isFavorite }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['girlDetails', id] });
      await queryClient.cancelQueries({ queryKey: ['girls'] });

      // Optimistically update girl details if cached
      const previousDetails = queryClient.getQueryData<GirlProfile>(['girlDetails', id]);
      if (previousDetails) {
        queryClient.setQueryData<GirlProfile>(['girlDetails', id], {
          ...previousDetails,
          isFavorite: isFavorite,
        });
      }

      return { previousDetails };
    },
    onError: (err, variables, context) => {
      if (context?.previousDetails) {
        queryClient.setQueryData(['girlDetails', variables.id], context.previousDetails);
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate favorites list to ensure it's in sync
      queryClient.invalidateQueries({ queryKey: ['girls', 'favorites'] });
    },
  });
};
