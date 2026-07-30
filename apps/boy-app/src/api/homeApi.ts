import apiClient from './apiClient';

export interface WalletSummary {
  currentBalance: number;
  lifetimeRecharge: number;
  lifetimeSpent: number;
}

export interface GirlProfile {
  _id: string;
  name: string;
  avatar: string;
  bio: string;
  averageRating: number;
  isOnline: boolean;
  isFavorite: boolean;
  totalReviews?: number;
  phone?: string;
}

export interface ChatSummary {
  _id: string;
  status: string;
  otherParticipant: {
    _id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

export const fetchWalletSummary = async (): Promise<WalletSummary> => {
  const { data } = await apiClient.get('/wallet');
  return data.data;
};

export const fetchDiscoveryGirls = async (filters: Record<string, any>): Promise<GirlProfile[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  const { data } = await apiClient.get(`/girls?${params.toString()}`);
  return data.data;
};

export const fetchRecentChats = async (): Promise<ChatSummary[]> => {
  const { data } = await apiClient.get('/chats'); // Removed limit=5 so all recent chats show
  return data.data;
};

export const fetchGirlDetails = async (id: string): Promise<GirlProfile> => {
  const { data } = await apiClient.get(`/girls/${id}`);
  return data.data;
};

export const toggleFavorite = async (id: string, isFavorite: boolean): Promise<void> => {
  if (isFavorite) {
    await apiClient.post(`/girls/${id}/favorite`);
  } else {
    await apiClient.delete(`/girls/${id}/favorite`);
  }
};
