<script setup lang="ts">
import '~/assets/css/chat-layout.css';
import type { Block } from '~/types/friends';

const friendsApi = useFriendsApi();
const profileImage = useProfileImage();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const blockList = ref<Block[]>([]);

async function getBlockedUser() {
  const res: ApiResponse<Block[]> = await friendsApi.getBlockedUsers();
  if (res.success) blockList.value = res.data;
}

async function unblockUser(username: string) {
  const check = confirm("해당 유저의 차단을 해제하시겠습니까?");
  if (!check) return;

  const res = await friendsApi.unblockUser(username);
  if (res.success) {
      alert(res.message);
      await getBlockedUser();
  }
}

onMounted(async () => {
  await getBlockedUser();
});
</script>

<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="user-popup block-list-modal" ref="popupRef">
      <div class="user-info modal-header">
        <div class="me">
          <p class="name">차단 목록 관리</p>
        </div>
      </div>

      <main class="modal-body scroll-area">
        <div v-if="blockList.length === 0" class="no-bio empty-message">
          <p>차단한 유저가 없습니다.</p>
        </div>
        
        <div v-else class="invite-list">
          <div 
            v-for="user in blockList"
            class="user-item block-item"
          >
            <div class="user-avatar small">
              <img :src="profileImage.getUrl(user.profileUrlName)" />
            </div>
            
            <div class="user-meta">
              <span class="user-name">{{ user.nickname }}</span>
              <span class="user-last">@{{ user.username }}</span>
            </div>

            <button 
              class="primary-button unblock-btn" 
              @click="unblockUser(user.username)"
            >
              해제
            </button>
          </div>
        </div>
      </main>

      <div class="choice modal-footer">
        <button class="primary-button cancel-btn" @click="$emit('close')">닫기</button>
      </div>
    </div>
  </div>
</template>