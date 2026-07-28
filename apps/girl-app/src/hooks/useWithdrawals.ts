import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawalApi, RequestWithdrawalPayload } from '../api/withdrawalApi';

export const useWithdrawalSummary = () => {
  return useQuery({
    queryKey: ['withdrawalSummary'],
    queryFn: withdrawalApi.getSummary,
  });
};

export const useMyWithdrawals = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ['myWithdrawals', params],
    queryFn: () => withdrawalApi.getWithdrawals(params),
  });
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequestWithdrawalPayload) => withdrawalApi.requestWithdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalSummary'] });
      queryClient.invalidateQueries({ queryKey: ['myWithdrawals'] });
    },
  });
};

export const useCancelWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => withdrawalApi.cancelWithdrawal(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalSummary'] });
      queryClient.invalidateQueries({ queryKey: ['myWithdrawals'] });
    },
  });
};
