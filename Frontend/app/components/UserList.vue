<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useAlarmStore } from '~/stores/alarm';
import { io } from 'socket.io-client';

const config = useRuntimeConfig();
const socket = io(`${config.public.apiBase}`);
const authStore = useAuthStore();
const alarmStore = useAlarmStore();
const router = useRouter();
const route = useRoute();

const friends = ref<Friend[]>([]);

interface Friend {
  id : number;
  username: string;
  nickname: string;
}

async function joinDirectRoom(friendId : number) {
  router.push(`/chat/${friendId}`);
}

function goSettings() {
  router.push({
    path: '/settings',
    query: { from: encodeURIComponent(route.fullPath) }
  });
}

function onImgError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = `${config.public.apiBase}/uploads/profiles/default-avatar.webp`;
}

onMounted(() => {
  socket.on('joinedRoom', (roomName) => {
    alert(`${roomName} 방에 입장했습니다.`);
  });

  socket.on('previousMessage', (msgs) => {
    let alarms : number = 0;
    let senderId : number = 0;
    for (const item of msgs) {
      if (item.status == "delivered") {
        alarms ++;
        senderId = item.sender_id;
      };
    };

    alarmStore.setAlarms(senderId, alarms);
  });

  socket.on('newMessage', (msg) => {
    alarmStore.addAlarm(msg[0].sender_id);
  });
});

watch(() => authStore.friends,
  (newVal) => {
    if (!Array.isArray(newVal)) return;

    friends.value = newVal;

    for (const item of friends.value) {
      socket.emit('joinDirectRoom', {
        userId1: authStore.userid,
        userId2: item.id
      });
    }
  },
  { immediate: true }
);

watchEffect(() => {
  friends.value = authStore.friends;
})
</script>

<template>
  <nav class="user-list" aria-label="Direct messages">
    <h3>다이렉트 메세지</h3>

    <div class="user-list-scroll">
      <ul>
        <li v-for="(item, index) in friends" :key="index">
          <button class="user-item" @click="joinDirectRoom(item.id)">
            <div class="user-avatar">
              <img :src="`${config.public.apiBase}/uploads/profiles/${item.id}.webp`" alt="avatar" @error="onImgError" />
            </div>
            <div class="user-meta">
              <div class="user-name">{{ item.username }}</div>
              <div class="user-last">대화 시작하기</div>
            </div>
            <div>
              {{ alarmStore.alarms[item.id] }}
            </div>
          </button>
        </li>
        <li v-if="friends.length === 0" class="user-last" style="padding:10px 0; color:var(--muted);">친구가 없습니다.</li>
      </ul>
    </div>

    <div class="user-list-footer">
      <button class="primary-button" @click="router.push('/chat')">친구 추가</button>
      <button class="primary-button" @click="goSettings">설정</button>
      <UserInfo />
    </div>
  </nav>
</template>
