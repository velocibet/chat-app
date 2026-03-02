<script setup lang="ts">
import { MessageCirclePlus } from 'lucide-vue-next';
import CreateChatRoom from '~/components/CreateChatRoom.vue';

const route = useRoute();
const router = useRouter();
const chatRoomApi = useChatroomApi();
const { connect } = useSocket();
const chatSocket = useChatSocket();
const profileImage = useProfileImage();
const roomImage = useRoomImage();
const authStore = useAuthStore();

const rooms = ref<ChatroomListItem[]>([]);
const unreadCounts = ref<Record<number, number>>({});
const openedMenuId = ref<number | null>(null);
const showRoomPopup = ref(false);
const popupRef = ref<InstanceType<typeof CreateChatRoom> | null>(null);
const dropdownStyle = ref({});
let unreadHandler: ((data: { roomId: number }) => void) | null = null;

const { data: roomsData } = await useAsyncData<ApiResponse<ChatroomListItem[]>>('rooms', () => chatRoomApi.getRooms());

if (roomsData.value?.data) {
  rooms.value = roomsData.value.data;
  rooms.value.forEach(room => {
    unreadCounts.value[room.id] = room.unread_count;
  });
}

function toggleRoomPopup() {
  showRoomPopup.value = !showRoomPopup.value;
}

function handleClickOutside(event: MouseEvent) {
  const popupEl = popupRef.value?.popupRoot;
  if (popupEl && !popupEl.contains(event.target as Node)) {
    showRoomPopup.value = false;
  }
}

async function checkMiddleware(roomId: number, message: string) {
  if (!confirm(message)) return;
  await chatRoomApi.leaveRoom(roomId);
}

function joinDirectRoom(id: number) {
  unreadCounts.value[id] = 0; 
  router.push(`/chat/${id}`);
}

function getPatner(users: RoomUserRow[]) {
  return users.find((p: RoomUserRow) => p.user_id !== authStore.user?.userId);
}

const goToSettings = () => router.push({
  path: '/settings',
  query: { from: encodeURIComponent(route.fullPath) }
});

function toggleMenu(roomId: number, event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dropdownStyle.value = {
    position: 'fixed',
    top: rect.top + 'px',
    left: rect.right + 'px',
  };
  openedMenuId.value = openedMenuId.value === roomId ? null : roomId;
}

onMounted(async () => {
  if (roomsData.value?.success === false) alert(roomsData.value?.message);

  await connect();
  
  chatSocket.onUpdateRoomList((res: socketResponse) => {
    if (!res.success) return;
    rooms.value = res.data;
    res.data.forEach((room: ChatroomListItem) => {
      unreadCounts.value[room.id] = room.unread_count;
    });
  });

  unreadHandler = (data: { roomId: number }) => {
    console.log("알람업데이틋")
    unreadCounts.value[data.roomId] = (unreadCounts.value[data.roomId] || 0) + 1;
  };

  chatSocket.onUnreadUpdate(unreadHandler);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (unreadHandler) chatSocket.offUnreadUpdate(unreadHandler);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <nav class="user-list">
    <div class="add-room" @click.stop="toggleRoomPopup">
      <MessageCirclePlus />
    </div>
    <h3>다이렉트 메세지</h3>
    <div class="user-list-scroll">
      <ul>
        <li v-for="(item, index) in rooms" :key="index">
          <button class="user-item" @click="joinDirectRoom(item.id)">
            <div class="user-avatar">
              <img v-if="item.type === 'dm'" :src="profileImage.getUrl(getPatner(item.room_users)?.profileUrlName)" />
              <img v-else :src="roomImage.getUrl(item.room_image_url)" />
            </div>
            <div class="user-meta">
              <div v-if="item.type === 'dm'" class="user-name">{{ getPatner(item.room_users)?.nickname }}</div>
              <div v-else class="user-name">{{ item.title }}</div>
              <div class="user-last">대화 시작하기</div>
            </div>
            <div v-if="unreadCounts[item.id]! > 0" class="user-alarm">
              {{ unreadCounts[item.id] }}
            </div>
            <p class="more-btn" @click.stop="toggleMenu(item.id, $event)">︙</p>
            <Teleport to="body">
              <ul v-if="openedMenuId === item.id" class="dropdown-menu" :style="dropdownStyle" @click.stop>
                <li>
                  <button v-if="Number(item.owner_user_id) === authStore.user?.userId" @click="checkMiddleware(item.id, '채팅방 삭제?')">삭제</button>
                  <button v-else @click="checkMiddleware(item.id, '채팅방 퇴장?')">퇴장</button>
                </li>
              </ul>
            </Teleport>
          </button>
        </li>
      </ul>
    </div>
    <div class="user-list-footer">
      <button class="primary-button" @click="router.push('/chat')">친구 추가</button>
      <button class="primary-button" @click="goToSettings">설정</button>
      <UserInfo />
    </div>
  </nav>
  <Teleport to="body">
    <CreateChatRoom v-if="showRoomPopup" ref="popupRef" @close="showRoomPopup = false" />
  </Teleport>
</template>