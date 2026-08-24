import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getSocketBaseUrl } from '../config/backendConfig';
import { refreshAccessToken } from '../api/apiClient';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: (force?: boolean) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated } = useAuthStore();
  const isRefreshingAuth = useRef(false);

  const connect = async (force: boolean = false) => {
    const currentToken = useAuthStore.getState().accessToken;
    if (!currentToken) return;
    if (socket?.connected && !force) return;

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    const socketUrl = await getSocketBaseUrl();
    console.log('Connecting socket to:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token: currentToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      isRefreshingAuth.current = false;
    });

    // Real-time Global Wallet Sync
    newSocket.on('wallet:update', (payload: any) => {
      console.log('[SocketProvider] wallet:update event received:', payload);
      const newBal = payload.newBalance !== undefined ? payload.newBalance : payload.balance;
      if (newBal !== undefined) {
        queryClient.setQueryData(['walletSummary'], (old: any) =>
          old ? { ...old, currentBalance: newBal } : { currentBalance: newBal }
        );
      }
      queryClient.invalidateQueries({ queryKey: ['walletSummary'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    });

    newSocket.on('chat:stats_update', (payload: any) => {
      if (payload?.remainingCoins !== undefined) {
        queryClient.setQueryData(['walletSummary'], (old: any) =>
          old ? { ...old, currentBalance: payload.remainingCoins } : { currentBalance: payload.remainingCoins }
        );
        queryClient.invalidateQueries({ queryKey: ['walletSummary'] });
      }
    });

    // Real-time In-App Notifications Sync
    newSocket.on('notification:received', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    });

    newSocket.on('notification:count_update', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    });

    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('connect_error', async (error) => {
      console.warn('Socket connection error:', error.message);

      const isAuthError =
        error.message &&
        (error.message.toLowerCase().includes('auth') ||
          error.message.toLowerCase().includes('token') ||
          error.message.toLowerCase().includes('unauthorized'));

      if (isAuthError && !isRefreshingAuth.current) {
        isRefreshingAuth.current = true;
        newSocket.disconnect();
        setIsConnected(false);

        console.log('[Socket] Auth error encountered. Refreshing access token...');
        const freshToken = await refreshAccessToken();
        isRefreshingAuth.current = false;

        if (freshToken) {
          console.log('[Socket] Token refreshed successfully. Reconnecting socket...');
          connect(true);
        } else {
          console.warn('[Socket] Could not refresh token. Session expired.');
        }
      }
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Auto connect/disconnect based on auth state
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, accessToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};
