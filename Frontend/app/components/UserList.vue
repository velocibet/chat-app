<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useAlarmStore } from '~/stores/alarm';
import { io } from 'socket.io-client';

const config = useRuntimeConfig();
const authStore = useAuthStore();
const alarmStore = useAlarmStore();
const router = useRouter();
const route = useRoute();
const socket = useState<any>('socket');

const friends = ref<Friend[]>([]);
const isNewMessage = ref<Record<number, boolean>>({});

interface Friend {
  id : number;
  username: string;
  nickname: string;
}

async function joinDirectRoom(friendId : number) {
  isNewMessage.value[friendId] = false;
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

// 중복 등록 방지
watch(
  () => socket.value,
  (s) => {
    console.log(socket.value)
    if (!s) return;
    s.off('previousMessage');
    s.off('newMessage');

    s.on('previousMessage', (msgs: any) => {
      const last = msgs[msgs.length - 1];
      const lastSender = last.sender_id;
      const lastReceiver = last.receiver_id;

      const partnerId =
        lastSender === authStore.userid ? lastReceiver : lastSender;

      if (lastSender === authStore.userid) {
        alarmStore.setAlarms(partnerId, 0);
        isNewMessage.value[partnerId] = false;
        return;
      }

      let alarms = 0;
      for (const item of msgs) {
        if (
          item.status === 'delivered' &&
          item.sender_id !== authStore.userid
        ) {
          alarms++;
        }
      }

      if (alarms > 0) isNewMessage.value[partnerId] = true;
      alarmStore.setAlarms(partnerId, alarms);
    });

    s.on('newMessage', (msg: any) => {
      const data = msg;
      const partnerId =
        data.sender_id === authStore.userid
          ? data.receiver_id
          : data.sender_id;

      if (data.sender_id === authStore.userid) {
        isNewMessage.value[partnerId] = false;
        return;
      }

      if (data.status === 'delivered' || data.status === 'sent') {
        isNewMessage.value[partnerId] = true;
        alarmStore.addAlarm(data.sender_id);
      }
    });
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
              <div class="user-name">{{ item.nickname }}</div>
              <div class="user-last">대화 시작하기</div>
            </div>
            <div v-show="isNewMessage[item.id]" class="user-alarm">
              {{ alarmStore.alarms[item.id] }}
            </div>
          </button>
        </li>
        <li v-if="friends.length === 0" class="user-last">친구가 없습니다.</li>
      </ul>
    </div>

    <div class="user-list-footer">
      <button class="primary-button" @click="router.push('/chat')">친구 추가</button>
      <button class="primary-button" @click="goSettings">설정</button>
      <UserInfo />
    </div>
  </nav>
</template>
