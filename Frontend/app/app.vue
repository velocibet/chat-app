<script setup lang="ts">
import 'normalize.css';
import { useFriendsStore } from '@/stores/friends';

const route = useRoute();
const { connect, disconnect, socket } = useSocket();
const friendsStore = useFriendsStore();

let heartbeatTimer: NodeJS.Timeout | null = null;

const startHeartbeat = () => {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (socket.value?.connected) {
      socket.value.emit('heartbeat');
    }
  }, 10000);
};

const stopHeartbeat = () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
};

const setupSocketListeners = () => {
  if (!socket.value) return;

  socket.value.on('user_status_changed', (data: { userId: number, isOnline: boolean }) => {
    console.log(`[Status] 유저 ${data.userId} : ${data.isOnline ? '온라인' : '오프라인'}`);
    friendsStore.updateFriendStatus(data.userId, data.isOnline);
  });
};

watch(() => route.path, async (newPath) => {
  const isChatPath = newPath.startsWith('/chat') || newPath.startsWith('/settings');
  
  if (isChatPath) {
    await connect();
  } else {
    stopHeartbeat();
    disconnect();
  }
}, { immediate: true });

onUnmounted(() => {
  stopHeartbeat();
  disconnect();
});
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>