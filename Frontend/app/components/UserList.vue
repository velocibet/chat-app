<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const userApi = useUserApi();
const chatRoomApi = useChatroomApi();
const profileImage = useProfileImage();
const authStore = useAuthStore();
const friendsStore = useFriendsStore();

const { data: roomsData } = await useAsyncData<ApiResponse<ChatroomListItem[]>>('rooms', () => chatRoomApi.getRooms());
const rooms = computed(() => roomsData.value?.data || []);

function joinDirectRoom(id: number) {
  router.push(`/chat/${id}`);
}

// 아래 함수는 채팅방의 타입이 'dm' 일 때만 사용하세요.
function getPatner(users: RoomUserRow[]) {
  return users.find(patner => patner.userId !== authStore.user?.userId);
}

// 아래 함수는 채팅방의 타입이 'group'일 때만 사용하세요.
function getOwner(users: RoomUserRow[], ownerId: number | null) {
  if (!ownerId) return
  return users.find((u: any) => u.userId === ownerId);
}

const goToSettings = () => router.push({
  path: '/settings',
  query: {
    from: encodeURIComponent(route.fullPath)
  }
});

onMounted(() => {
  if (roomsData.value?.success === false) {
    alert(roomsData.value?.message);
  }
})
</script>

<template>
  <nav class="user-list" aria-label="Direct messages">
    <h3>다이렉트 메세지</h3>

    <div class="user-list-scroll">
      <ul>
        <li v-for="(item, index) in rooms" :key="index">
          <button class="user-item" @click="joinDirectRoom(item.id)">
            <div class="user-avatar">
              <img v-if="item.type === 'dm'" :src="profileImage.getUrl(getPatner(item.room_users)?.profileUrlName)" alt="avatar" />
              <img v-else-if="item.type === 'group'" :src="profileImage.getUrl(getOwner(item.room_users, item.ownerUserId)?.profileUrlName)" alt="avatar" />
            </div>
            <div class="user-meta">
              <div v-if="item.type === 'dm'" class="user-name">{{ getPatner(item.room_users)?.nickname }}</div>
              <div v-else-if="item.type === 'group'" class="user-name">{{ item.title }}</div>
              <div class="user-last">대화 시작하기</div>
            </div>
            <!-- <div v-show="isNewMessage[item.id]" class="user-alarm">
              {{ alarmStore.alarms[item.id] }}
            </div> -->
          </button>
        </li>
        <li v-if="rooms.length === 0" class="user-last">채팅방이 존재하지 않습니다.</li>
      </ul>
    </div>

    <div class="user-list-footer">
      <button class="primary-button" @click="router.push('/chat')">친구 추가</button>
      <button class="primary-button" @click="goToSettings">설정</button>
      <UserInfo />
    </div>
  </nav>
</template>