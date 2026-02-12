<script setup lang="ts">
import { MessageCirclePlus } from 'lucide-vue-next';
import RoomPopup from '~/components/RoomPopup.vue';

const route = useRoute();
const router = useRouter();
const userApi = useUserApi();
const chatRoomApi = useChatroomApi();
const { socket, connect } = useSocket();
const chatSocket = useChatSocket();
const profileImage = useProfileImage();
const roomImage = useRoomImage();
const authStore = useAuthStore();
const friendsStore = useFriendsStore();

const rooms = reactive<ChatroomListItem[]>([]);
const openedMenuId = ref<number | null>(null);
const showRoomPopup = ref(false);
const popupRef = ref<InstanceType<typeof RoomPopup> | null>(null);

const { data: roomsData } = await useAsyncData<ApiResponse<ChatroomListItem[]>>('rooms', () => chatRoomApi.getRooms());
if (roomsData.value?.data) {
  rooms.push(...roomsData.value.data);
}

function toggleRoomPopup() {
  showRoomPopup.value = !showRoomPopup.value;
}

function handleClickOutside(event: MouseEvent) {
  const popupEl = popupRef.value?.popupRoot;
  if (!popupEl) return;

  if (!popupEl.contains(event.target as Node)) {
    showRoomPopup.value = false;
  }
}

async function checkMiddleware(roomId: number, message: string) {
  const check = confirm(message);
  if (!check) return;

  await chatRoomApi.leaveRoom(roomId);
}

function joinDirectRoom(id: number) {
  router.push(`/chat/${id}`);
}

// 아래 함수는 채팅방의 타입이 'dm' 일 때만 사용하세요.
function getPatner(users: RoomUserRow[]) {
  return users.find((p: RoomUserRow) => p.user_id !== authStore.user?.userId);
}

// 아래 함수는 채팅방의 타입이 'group'일 때만 사용하세요.
function getOwner(users: RoomUserRow[], ownerId: number | null) {
  if (!ownerId) return
  return users.find((u: RoomUserRow) => u.user_id === ownerId);
}

const goToSettings = () => router.push({
  path: '/settings',
  query: {
    from: encodeURIComponent(route.fullPath)
  }
});

function toggleMenu(roomId: number) {
  openedMenuId.value = openedMenuId.value === roomId ? null : roomId;
}

function closeMenu() {
  openedMenuId.value = null;
}

onMounted(async () => {
  if (roomsData.value?.success === false) {
    alert(roomsData.value?.message);
  }

  await connect();
  chatSocket.onUpdateRoomList((res: socketResponse) => {
    if (!res.success) return
    
    const roomData = res.data;
    rooms.values = roomData;
  })

  document.addEventListener('click', handleClickOutside);
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <nav class="user-list" aria-label="Direct messages">
    <div class="add-room" @click.stop="toggleRoomPopup">
      <MessageCirclePlus />
    </div>
    <h3>다이렉트 메세지</h3>

    <div class="user-list-scroll">
      <ul>
        <li v-for="(item, index) in rooms" :key="index">
          <button class="user-item" @click="joinDirectRoom(item.id)">
            <div class="user-avatar">
              <img v-if="item.type === 'dm'" :src="profileImage.getUrl(getPatner(item.room_users)?.profileUrlName)" alt="avatar" />
              <img v-else-if="item.type === 'group'" :src="roomImage.getUrl(item.room_image_url)" alt="avatar" />
            </div>
            <div class="user-meta">
              <div v-if="item.type === 'dm'" class="user-name">{{ getPatner(item.room_users)?.nickname }}</div>
              <div v-else-if="item.type === 'group'" class="user-name">{{ item.title }}</div>
              <div class="user-last">대화 시작하기</div>
            </div>
            <p class="more-btn" @click.stop="toggleMenu(item.id)">
              ︙
            </p>
            <div
              v-if="openedMenuId === item.id"
              class="dropdown"
              @click.stop
            >
              <div class="danger">
                <p
                  v-if="item.owner_user_id == authStore.user?.userId"
                  @click="checkMiddleware(item.id, '채팅방을 삭제하시겠습니까?')">
                  채팅방 삭제하기
                </p>
                <p
                  v-else
                  @click="checkMiddleware(item.id, '채팅방을 나가시겠습니까?')">
                  채팅방 나가기
                </p>
              </div>
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
  <Teleport to="body">
    <RoomPopup
      v-if="showRoomPopup"
      ref="popupRef"
      @close="showRoomPopup = false"
    />
  </Teleport>
</template>