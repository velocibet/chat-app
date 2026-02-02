import { io, Socket } from 'socket.io-client';
import { useSocketStore } from '~/stores/socket';

export const useSocket = () => {
  const socketStore = useSocketStore();

  const connect = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (socketStore.socket?.connected) {
        resolve();
        return;
      }

      if (!import.meta.client) {
        reject(new Error('Client-side only'));
        return;
      }

      const config = useRuntimeConfig();

      const s = io(config.public.wsBase, {
        withCredentials: true,
        transports: ['websocket'],
        reconnection: true,
      });

      socketStore.setSocket(s as unknown as Socket);

      const onConnect = () => {
        console.log('Connected to Socket Server ✅');
        socketStore.setConnected(true);
        s.off('connect', onConnect);
        s.off('connect_error', onError);
        resolve();
      };

      const onError = (error: any) => {
        console.error('Socket connection error:', error);
        s.off('connect', onConnect);
        s.off('connect_error', onError);
        reject(error);
      };

      s.on('connect', onConnect);
      s.on('connect_error', onError);

      s.on('disconnect', (reason) => {
        console.log('Disconnected ❌', reason);
        socketStore.setConnected(false);
      });

      // 타임아웃 설정 (10초)
      setTimeout(() => {
        if (!s.connected) {
          s.off('connect', onConnect);
          s.off('connect_error', onError);
          reject(new Error('Socket connection timeout'));
        }
      }, 10000);
    });
  };

  const disconnect = () => {
    socketStore.socket?.disconnect();
    socketStore.clear();
  };

  return {
    socket: computed(() => socketStore.socket),
    connected: computed(() => socketStore.connected),
    connect,
    disconnect,
  };
};