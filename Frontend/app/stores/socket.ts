import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import type { Socket } from 'socket.io-client';

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null as Socket | null,

    connected: false,
  }),

  actions: {
    setSocket(socket: Socket) {
      this.socket = markRaw(socket);
    },

    setConnected(value: boolean) {
      this.connected = value;
    },

    clear() {
      this.socket = null;
      this.connected = false;
    },
  },
});
