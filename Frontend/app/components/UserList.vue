<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { io } from 'socket.io-client';

const auth = useAuthStore();
const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();

const socket = io(`${config.public.apiBase}`, { withCredentials: true });

const friends = ref<{ userid: string; username: string }[]>([]);
const userAvatars = ref<Record<string, string>>({});

async function fetchAvatar(userid: string) {
  if (userAvatars.value[userid]) return userAvatars.value[userid];

  try {
    const res = await fetch(`${config.public.apiBase}/api/users/${userid}/profile`);
    const data = await res.json();
    const url = `${config.public.apiBase}/uploads/profiles/${data.profileImage}`;
    userAvatars.value[userid] = url;
    return url;
  } catch {
    userAvatars.value[userid] = `${config.public.apiBase}/uploads/profiles/default-avatar.jpg`;
    return;
  }
}

watch(
  friends,
  (list) => {
    list.forEach(f => {
      if (!userAvatars.value[f.userid]) {
        fetchAvatar(f.userid);
      }
    });
  },
  { deep: true }
);

async function fetchFriends() {
  try {
    const { data, error } = await useFetch<{ friends: { userid: string; username: string }[] }>(
      `${config.public.apiBase}/api/users/friends`,
      { credentials: 'include' }
    );
    if (error.value) {
      console.error('친구 목록 불러오기 실패:', error.value);
      router.push('/');
      return;
    }
    friends.value = data.value?.friends || [];
  } catch (err) {
    console.error('HTTP 요청 에러:', err);
    router.push('/');
  }
}

function openDM(targetUserid: string) {
  if (!auth.username) return;
  socket.emit('joinRoom', { userIds: [auth.userid, targetUserid] });

  socket.once('joinedRoom', (payload: { roomId: number }) => {
    router.push(`/chat/${payload.roomId}`);
  });

  socket.once('error', (err) => {
    console.error('socket error', err);
  });
}

function goSettings() {
  router.push({
    path: '/settings',
    query: { from: encodeURIComponent(route.fullPath) }
  });
}

onMounted(() => {
  fetchFriends();
});

onBeforeUnmount(() => {
  socket.off('joinedRoom');
  socket.off('error');
});
</script>

<template>
  <nav class="user-list" aria-label="Direct messages">
    <h3>다이렉트 메세지</h3>

    <div class="user-list-scroll">
      <ul>
        <li v-for="u in friends" :key="u.userid">
          <button class="user-item" @click="openDM(u.userid)">
            <div class="user-avatar">
              <img :src="userAvatars[u.userid]" alt="avatar" />
            </div>
            <div class="user-meta">
              <div class="user-name">{{ u.username }}</div>
              <div class="user-last">대화 시작하기</div>
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
