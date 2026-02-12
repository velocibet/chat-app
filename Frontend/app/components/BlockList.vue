<script setup lang="ts">
import '~/assets/css/chat-layout.css';
import type { Block } from '~/types/friends';

const friendsApi = useFriendsApi();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const popupRef = ref<HTMLElement | null>(null); // 최상위 div ref
const blockList = ref<Block[]>([]);

async function getBlockedUser() {
  const res: ApiResponse<Block[]> = await friendsApi.getBlockedUsers();
  if (res.success) blockList.value = res.data;
}

async function unblockUser(username: string) {
  const check = confirm("해당 유저의 차단을 해제하시겠습니까?");
  if (!check) return;

  const res = await friendsApi.unblockUser(username);
  alert(res.message);
}

// 최상위 div 외부 클릭 감지
const handleClickOutside = (event: MouseEvent) => {
  if (popupRef.value && !popupRef.value.contains(event.target as Node)) {
    emit('close');
  }
}

onMounted(async () => {
  await getBlockedUser();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="room-popup" ref="popupRef">
    <header>
      <h3>차단 목록</h3>
    </header>
    <main>
      <div v-if="blockList.length === 0" class="empty-list">
        <p>차단한 유저가 없습니다.</p>
      </div>
      <div v-else v-for="user in blockList" :key="user.username" class="list">
        <div class="title">
          <p>{{ user.nickname }}</p>
          <span>{{ user.username }}</span>
        </div>
        <button @click="unblockUser(user.username)">
          차단 해제하기
        </button>
      </div>
    </main>
  </div>
</template>
