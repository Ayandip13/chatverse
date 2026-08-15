import apiClient from './apiClient';

export interface Notification {
  _id: string;
  title: string;
  body?: string;
  message?: string;
  type: string;
  status?: 'UNREAD' | 'READ' | string;
  isRead?: boolean;
  actionUrl?: string;
  createdAt: string;
}

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
