<script setup lang="ts">
interface Props {
  roomId: string | number;
  alreadyJoinedUsers: any[]; 
}
const props = defineProps<Props>();
const emit = defineEmits(['close', 'invited']);

const friendsApi = useFriendsApi();
const chatRoomApi = useChatroomApi();
const profileImage = useProfileImage();

const searchQuery = ref('');
const friends = ref<any[]>([]);
const selectedUserIds = ref<number[]>([]);
const isLoading = ref(true);

async function fetchFriends() {
    isLoading.value = true;

    const res = await friendsApi.getFriends(); 
    if (res.success) {
        friends.value = res.data.filter((f: any) => 
        !props.alreadyJoinedUsers.some(u => u.user_id === f.userId)
        );
    }

    isLoading.value = false;
}

const filteredFriends = computed(() => {
  return friends.value.filter(f => 
    f.nickname.includes(searchQuery.value) || f.username.includes(searchQuery.value)
  );
});

async function handleInvite() {
  if (selectedUserIds.value.length === 0) return;
  
  const res = await chatRoomApi.inviteUsers(+props.roomId, selectedUserIds.value);
  
  if (res.success) {
    alert(res.message);
    emit('invited');
    emit('close');
  } else {
    alert(res.message);
  }
}

onMounted(fetchFriends);
</script>

<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="user-popup invite-modal">
      <div class="user-info modal-header">
        <div class="me">
          <p class="name">대화상대 초대</p>
        </div>
      </div>

      <div class="request-form modal-search">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="이름 또는 아이디로 검색" 
          class="primary-input"
        />
      </div>

      <div class="modal-body scroll-area">
        <div v-if="isLoading" class="loading-container">
          <div class="spinner"></div>
          <p class="loading-text">친구 목록 로딩 중...</p>
        </div>
        
        <div v-else-if="filteredFriends.length === 0" class="no-bio empty-message">
          초대할 수 있는 친구가 없습니다.
        </div>
        
        <div v-else class="invite-list">
          <label 
            v-for="friend in filteredFriends" 
            :key="friend.userId" 
            class="user-item invite-item"
          >
            <input 
              type="checkbox" 
              :value="friend.userId" 
              v-model="selectedUserIds"
              class="invite-checkbox"
              @click.stop
            />
            <div class="user-avatar small">
              <img :src="profileImage.getUrl(friend.profileUrlName)" />
            </div>
            <div class="user-meta">
              <span class="user-name">{{ friend.nickname }}</span>
              <span class="user-last">@{{ friend.username }}</span>
            </div>
          </label>
        </div>
      </div>

      <div class="choice modal-footer">
        <button class="primary-button cancel-btn" @click="$emit('close')">
          취소
        </button>
        <button 
          class="primary-button confirm-btn" 
          @click="handleInvite"
          :disabled="selectedUserIds.length === 0"
        >
          확인 ({{ selectedUserIds.length }})
        </button>
      </div>
    </div>
  </div>
</template>