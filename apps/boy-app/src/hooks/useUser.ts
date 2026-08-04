import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  fetchMyProfile,
  updateMyProfile,
  deleteMyAccount,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/userApi";
import { useAuthStore } from "../store/authStore";

export const useProfile = () => {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: fetchMyProfile,
    staleTime: 60000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["myProfile"], updatedUser);
      // Sync authStore with latest DB state
      updateUser({
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
      });
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: deleteMyAccount,
  });
};

export const useNotifications = () => {
  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam = 1 }) => fetchNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.items.length === 20 ? allPages.length + 1 : undefined;
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000, // Poll every 30s
  });
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });
};
