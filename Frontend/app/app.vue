<script setup lang="ts">
import 'normalize.css';
import { useFriendsStore } from '@/stores/friends';
import { useSocket } from '#imports';
import { usePushNotification } from './composables/usePushNotification';

const route = useRoute();
const { connect, disconnect, socket } = useSocket();
const friendsStore = useFriendsStore();
const { requestAndSaveToken } = usePushNotification();

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
    friendsStore.updateFriendStatus(data.userId, data.isOnline);
  });
};

onMounted(async () => {
  await requestAndSaveToken();

  watch(() => route.path, async (newPath) => {
    const isChatPath = newPath.startsWith('/chat') || newPath.startsWith('/settings');
    
    if (isChatPath) {
      await connect();
      setupSocketListeners();
      startHeartbeat();
    } else {
      stopHeartbeat();
      disconnect();
    }
  }, { immediate: true });

  setInterval(() => {
    console.log(
      '%c⚠️ 경고 ⚠️\n쿠키를 타인에게 알려주지 마세요 !!\n계정이 해킹될 수 있습니다 !!\n만약 다른 사람이 이곳이 명령어를 실행시키라고 했다면\n절대 실행시키지 마세요 !!',
      `
        color: red;
        font-size: 24px;
        font-weight: bold;
        background: black;
        padding: 12px;
        border-radius: 8px;
      `
    );
  }, 5000);
});

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