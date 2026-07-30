import apiClient from './apiClient';

export interface ChatRequest {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  boyId?: {
    _id: string;
    name: string;
    avatar?: string;
  } | string;
  girlId?: string;
  otherParticipant?: {
    _id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  };
  chatRequestId?: string;
  status: 'ACTIVE' | 'ENDED';
  startTime: string;
  endTime?: string;
  durationInMinutes?: number;
  totalCost?: number;
  createdAt: string;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export const fetchChatRequests = async (params?: { status?: string; page?: number; limit?: number }) => {
  const response = await apiClient.get('/chat-requests', { params });
  return response.data.data as ChatRequest[];
};

export const acceptChatRequest = async (requestId: string) => {
  const response = await apiClient.post(`/chat-requests/${requestId}/accept`);
  return response.data.data;
};

export const rejectChatRequest = async (requestId: string) => {
  const response = await apiClient.post(`/chat-requests/${requestId}/reject`);
  return response.data.data;
};

export const fetchActiveChats = async () => {
  const response = await apiClient.get('/chats', { params: { status: 'ACTIVE', limit: 20 } });
  return response.data.data as Chat[];
};

export const fetchRecentChats = async () => {
  const response = await apiClient.get('/chats', { params: { limit: 50 } });
  return response.data.data as Chat[];
};

export const fetchChatDetails = async (chatId: string) => {
  const response = await apiClient.get(`/chats/${chatId}`);
  return response.data.data as Chat;
};

export const fetchChatMessages = async (chatId: string, page = 1, limit = 50) => {
  const response = await apiClient.get(`/chats/${chatId}/messages`, { params: { page, limit } });
  return {
    messages: response.data.data as Message[],
    meta: response.data.meta,
  };
};

export const endChat = async (chatId: string) => {
  const response = await apiClient.post(`/chats/${chatId}/end`);
  return response.data.data;
};
