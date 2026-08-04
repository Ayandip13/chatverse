import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  fetchChatRequests,
  sendChatRequest,
  cancelChatRequest,
  fetchChats,
  fetchChatDetails,
  fetchChatMessages,
  endChat,
} from "../api/messagingApi";

// -- Chat Requests --
export const useChatRequests = (status?: string) => {
  return useQuery({
    queryKey: ["chatRequests", status],
    queryFn: () => fetchChatRequests({ status, limit: 50 }),
    staleTime: 0,
  });
};

export const useSendChatRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => sendChatRequest(targetUserId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chatRequests"] }),
  });
};

export const useCancelChatRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => cancelChatRequest(requestId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chatRequests"] }),
  });
};

// -- Chats --
export const useChats = (status?: string) => {
  return useQuery({
    queryKey: ["chats", status],
    queryFn: () => fetchChats({ status, limit: 50 }),
    staleTime: 0,
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
      // If we got exactly 50 messages, assume there might be a next page
      return lastPage.messages.length === 50 ? allPages.length + 1 : undefined;
    },
    staleTime: Infinity, // Rely on sockets to update
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
