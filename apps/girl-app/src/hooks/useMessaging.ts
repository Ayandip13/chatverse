import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  fetchChatRequests,
  acceptChatRequest,
  rejectChatRequest,
  fetchActiveChats,
  fetchRecentChats,
  fetchChatDetails,
  fetchChatMessages,
  endChat,
} from "../api/messagingApi";

export const useChatRequests = (status?: string) => {
  return useQuery({
    queryKey: ["chatRequests", status],
    queryFn: () => fetchChatRequests({ status, limit: 50 }),
    staleTime: 5000,
  });
};

export const useAcceptChatRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => acceptChatRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatRequests"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useRejectChatRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => rejectChatRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatRequests"] });
    },
  });
};

export const useActiveChats = () => {
  return useQuery({
    queryKey: ["chats", "ACTIVE"],
    queryFn: () => fetchActiveChats(),
    staleTime: 10000,
  });
};

export const useRecentChats = () => {
  return useQuery({
    queryKey: ["chats", "RECENT"],
    queryFn: () => fetchRecentChats(),
    staleTime: 5000,
  });
};

export const useChatDetails = (chatId: string) => {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => fetchChatDetails(chatId),
    staleTime: 60000,
  });
};

export const useChatMessages = (chatId: string) => {
  return useInfiniteQuery({
    queryKey: ["messages", chatId],
    queryFn: ({ pageParam = 1 }) => fetchChatMessages(chatId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.messages.length === 50 ? allPages.length + 1 : undefined;
    },
    staleTime: Infinity,
  });
};

export const useEndChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => endChat(chatId),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    },
  });
};
