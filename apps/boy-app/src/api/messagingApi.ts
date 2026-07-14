import apiClient from './apiClient';
import { ChatSummary } from './homeApi';

export interface ChatRequest {
  _id: string;
  senderId: string;
  targetUserId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  targetUser?: {
    _id: string;
    name: string;
    avatar: string;
  };
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatDetails extends ChatSummary {
  startTime: string;
  endTime?: string;
  durationInMinutes?: number;
  totalCost?: number;
}

// Chat Requests
export const fetchChatRequests = async (filters: { status?: string, page?: number, limit?: number }): Promise<ChatRequest[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.append(k, String(v)));
  const { data } = await apiClient.get(`/chat-requests?${params.toString()}`);
  return data.data;
};

export const sendChatRequest = async (targetUserId: string): Promise<void> => {
  await apiClient.post('/chat-requests', { targetUserId });
};

export const cancelChatRequest = async (requestId: string): Promise<void> => {
  await apiClient.post(`/chat-requests/${requestId}/cancel`);
};

// Chats
export const fetchChats = async (filters: { status?: string, page?: number, limit?: number }): Promise<ChatSummary[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.append(k, String(v)));
  const { data } = await apiClient.get(`/chats?${params.toString()}`);
  return data.data;
};

export const fetchChatDetails = async (chatId: string): Promise<ChatDetails> => {
  const { data } = await apiClient.get(`/chats/${chatId}`);
  return data.data;
};

export const fetchChatMessages = async (chatId: string, page = 1): Promise<{ messages: Message[], total: number }> => {
  const { data } = await apiClient.get(`/chats/${chatId}/messages?page=${page}&limit=50`);
  return { messages: data.data, total: data.meta.total };
};

export const endChat = async (chatId: string): Promise<void> => {
  await apiClient.post(`/chats/${chatId}/end`);
};
