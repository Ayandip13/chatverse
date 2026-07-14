import apiClient from './apiClient';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// User Profile
export const fetchMyProfile = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get('/users/me');
  return data.data;
};

export const updateMyProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  const { data } = await apiClient.patch('/users/me', updates);
  return data.data;
};

export const deleteMyAccount = async (): Promise<void> => {
  await apiClient.delete('/users/me');
};

// Notifications
export const fetchNotifications = async (page = 1, limit = 20): Promise<{ items: Notification[], total: number }> => {
  const { data } = await apiClient.get(`/notifications?page=${page}&limit=${limit}`);
  return { items: data.data, total: data.meta.total };
};

export const fetchUnreadCount = async (): Promise<number> => {
  const { data } = await apiClient.get('/notifications/unread-count');
  return data.data.count;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.post('/notifications/read-all');
};
