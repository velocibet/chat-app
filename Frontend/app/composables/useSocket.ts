import { Socket, io } from "socket.io-client";
import { ref, computed } from "vue";

const connectingPromise = ref<Promise<void> | null>(null);

export const useSocket = () => {
  const socketStore = useSocketStore();

  const connect = (): Promise<void> => {
    if (!import.meta.client) return Promise.resolve();

    if (socketStore.socket?.connected) return Promise.resolve();

    if (connectingPromise.value) return connectingPromise.value;

    connectingPromise.value = new Promise((resolve, reject) => {
      const config = useRuntimeConfig();

      const s = io(config.public.wsBase, {
        withCredentials: true,
        transports: ['websocket'],
        reconnection: true,
      });

      socketStore.setSocket(s as unknown as Socket);

      const onConnect = () => {
        socketStore.setConnected(true);
        connectingPromise.value = null;
        s.off('connect', onConnect);
        s.off('connect_error', onError);
        resolve();
      };

      const onError = (error: any) => {
        connectingPromise.value = null;
        s.off('connect', onConnect);
        s.off('connect_error', onError);
        reject(error);
      };

      s.on('connect', onConnect);
      s.on('connect_error', onError);

      s.on('disconnect', (reason: any) => {
        socketStore.setConnected(false);
      });
    });

    return connectingPromise.value;
  };

  const disconnect = () => {
    if (!import.meta.client) return;
    
    if (socketStore.socket) {
      socketStore.socket.disconnect();
      socketStore.clear();
      connectingPromise.value = null;
    }
  };

  return {
    socket: computed(() => socketStore.socket),
    connected: computed(() => socketStore.connected),
    connect,
    disconnect,
  };
};