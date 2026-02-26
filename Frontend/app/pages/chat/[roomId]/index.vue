<script setup lang="ts">
import '~/assets/css/chat-room.css';
import { Crown, CirclePlus } from 'lucide-vue-next';

definePageMeta({
  layout: "chat",
  middleware: ["auth"],
  // ssr: false
});

const router = useRouter();
const route = useRoute();

const chatApi = useChatApi();
const chatRoomApi = useChatroomApi();
const chatSocket = useChatSocket();
const authStore = useAuthStore();
const profileImage = useProfileImage();
const roomImage = useRoomImage();

const roomId = route.params.roomId as string;
const targetRoom = ref<ChatroomListItem | null>(null);
const messages = ref<any[]>([]);
const roomTitle = ref<string>('');
const input = ref<string>('');
const messageContainer = ref<HTMLElement | null>(null);
const openMenuId = ref<string | number | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const pendingImage = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const isSending = ref<boolean | null>(false);
const isEnd = ref<boolean>(false);
// const avatarMap = ref<Record<number, string>>({});
const selectedUserId = ref<number | null>();
const isInitialLoading = ref(true);
const openedMenuId = ref<number | null>(null);
const dropdownStyle = ref({});
const isInviteModalOpen = ref(false);

let loadMessagesHandler: ((response: any) => void) | null = null;
let newMessageHandler: ((response: any) => void) | null = null;
let deletedMessageHandler: ((response: any) => void) | null = null;

function selectFile () {
  fileInput.value?.click()
}

async function getRoom() {
  const res: ApiResponse<ChatroomListItem> = await chatRoomApi.getRoom(roomId);

  if (!res.success) {
    alert(res.message);
    router.go(-1);
    return
  }

  targetRoom.value = res.data;

  if (targetRoom.value.type === "dm") {
    const opponent = targetRoom.value.room_users.find((u: RoomUserRow) => u.user_id !== authStore.user?.userId);
    
    if (opponent) {
      roomTitle.value = opponent.nickname;
    }
  } else if (targetRoom.value.type === "group") {
    roomTitle.value = targetRoom.value.title || '이름을 불러올수 없습니다.';
  }
}

function handleFileChange (event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    alert('파일 크기는 2MB 이하만 가능합니다.')
    return
  }

  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드 가능합니다.')
    return
  }

  pendingImage.value = file
  previewUrl.value = URL.createObjectURL(file)
}

const cancelImage = () => {
  previewUrl.value = null
  pendingImage.value = null
}

const toggleMenu = (id: string | number) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

const closeMenu = () => {
  openMenuId.value = null
}

async function deleteMessage(item: any) {
  if (!confirm("정말 메세지를 삭제하시겠습니까?")) return;
  chatSocket.deleteMessageInRoom(+roomId, item.id, item.content);

  closeMenu();
}

function reportMessage() {
  alert("기능 구현 예정입니다.");
}


function shouldShowHeader(index: number) {
  if (index === 0) return true

  const current = messages.value[index]!
  const prev = messages.value[index - 1]!

  if (current.sender_id !== prev.sender_id) return true

  const currentTime = new Date(current.created_at).getTime()
  const prevTime = new Date(prev.created_at).getTime()

  return true // currentTime - prevTime > THREE_MINUTES
}

function formatKoreanTime(isoString: string) {
  const date = new Date(isoString)

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()

  return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`
}

function getImageUrl(item: any): string {
  if (item.isfile === 1 && item.content) {
    const config = useRuntimeConfig();
    return `${config.public.apiBase}/chat/image/${item.content}`;
  }
  return '';
}

function toggleUserMenu(userId: number, event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

  dropdownStyle.value = {
    position: 'fixed',
    top: rect.top + 'px',
    right: rect.right + 'px',
  };

  openedMenuId.value = openedMenuId.value === userId ? null : userId;
}

function handleInvited() {
  getRoom();
}

async function sendMessage() {
  if (isSending.value === true) return;
  isSending.value = true;

  try {
    if (pendingImage.value) {
      await chatApi.sendImage(+roomId, pendingImage.value);
      pendingImage.value = null;
      previewUrl.value = null;
    } else if (input.value.trim()) {
      chatSocket.sendMessageToRoom(+roomId, input.value);
      input.value = '';
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  } finally {
    isSending.value = false;
  }
}

async function downScroll() {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
}

async function onScroll() {
  if (!messageContainer.value) return;

  if (messageContainer.value.scrollTop === 0 && !isEnd.value) {
    chatSocket.loadMessages(+roomId, 15, messages.value[0]?.id);
  }
}

async function goToRoomSettings() {
  await router.push(`/chat/${roomId}/settings?from=${encodeURIComponent(route.path)}`);
}

async function handleKick(member: any) {
  if (!confirm(`${member.nickname}님을 정말 강퇴하시겠습니까?`)) return;

  const res = await chatRoomApi.kickUser(+roomId, member.user_id);
  if (res.success) {
    alert("강퇴되었습니다.");
    await getRoom();
  } else {
    alert(res.message);
  }
}

onMounted(async() => {
  await getRoom();
  
  try {
    await chatSocket.waitForSocket();
    await chatSocket.joinRoom(+roomId);
  } catch (error) {
    console.error('채팅방 입장 실패:', error);
    alert(`채팅방 입장 실패: ${error}`);
    return;
  } finally {
    isInitialLoading.value = false;
  }

  messages.value = [];
  isEnd.value = false;

  // if (loadMessagesHandler) {
  //   socketInstance.off('loadMessages', loadMessagesHandler);
  // }
  // if (newMessageHandler) {
  //   socketInstance.off('newMessage', newMessageHandler);
  // }

  loadMessagesHandler = (response: any) => {
    if (!response?.data) {
      return;
    }
    
    const msgs = Array.isArray(response.data) ? response.data : [response.data];
    
    if (msgs.length === 0) {
      isEnd.value = true;
      return;
    }

    if (!messageContainer.value) {
      return;
    }

    const container = messageContainer.value;
    const prevScrollHeight = container.scrollHeight;

    messages.value.unshift(...msgs);
    
    nextTick(() => {
      if (messageContainer.value) {
        const newScrollHeight = messageContainer.value.scrollHeight;
        messageContainer.value.scrollTop = newScrollHeight - prevScrollHeight;
      }
    });
  };

  newMessageHandler = (response: any) => {
    if (!response?.data) return;
    
    const msg = response.data;
    messages.value.push(msg);
    downScroll();
  };

  deletedMessageHandler = (response: any) => {
    if (!response?.data) return;
    const deletedId = response.data.id;
    messages.value = messages.value.filter(msg => msg.id !== deletedId);
  };

  chatSocket.onLoadMessages(loadMessagesHandler);
  chatSocket.onNewMessage(newMessageHandler);
  chatSocket.onDeletedMessage(deletedMessageHandler);

  chatSocket.loadMessages(+roomId, 30);
});

onUnmounted(() => {
  if (loadMessagesHandler) {
    chatSocket.offLoadMessages(loadMessagesHandler);
    loadMessagesHandler = null;
  }
  if (newMessageHandler) {
    chatSocket.offNewMessage(newMessageHandler);
    newMessageHandler = null;
  }
  if (deletedMessageHandler) {
    chatSocket.offDeletedMessage(deletedMessageHandler);
    deletedMessageHandler = null;
  }

  chatSocket.leaveRoom(+roomId);
})

</script>

<template>
  <div v-if="isInitialLoading">
    <div class="spinner"></div>
    <p>메세지 목록을 불러오는 중입니다.</p>
  </div>
  <div v-else class="room-container">
    <section class="chat-container">
      <div class="message-title">
        <img v-if="targetRoom?.type === 'dm'" :src="profileImage.getUrl(
          targetRoom.room_users.find((u: RoomUserRow) => u.user_id !== authStore.user?.userId)?.profileUrlName
        )"/>
        <img v-else-if="targetRoom?.type === 'group'" :src="roomImage.getUrl(
          targetRoom.room_image_url
        )" />
        <div class="title-content">
          <h4>{{ roomTitle }}</h4>
          <span>대화를 시작해보세요.</span>
        </div>
        <!-- <div class="isOnline">
          <span v-if="isFriendOnline">🟢 온라인</span>
          <span v-else>⛔ 오프라인</span>
        </div> -->
        <p v-if="targetRoom?.type === 'group' && authStore.user?.userId == targetRoom?.owner_user_id" @click="goToRoomSettings" style="cursor: pointer;">︙</p>
      </div>
      <div class="message-container" ref="messageContainer" @scroll="onScroll">
        <div v-for="(item, index) in messages" :key="item.id" class="message">
          <div v-if="shouldShowHeader(index)" class="message-top">
            <img :src="profileImage.getUrl(
              targetRoom?.room_users.find((u: RoomUserRow) => u.user_id === item.sender_id)?.profileUrlName
            )"
            @click.stop="selectedUserId = item.sender_id"
            style="cursor: pointer;" />
            <h4
            @click.stop="selectedUserId = item.sender_id"
            style="cursor: pointer;">{{ targetRoom?.room_users.find((u: RoomUserRow) => u.user_id === item.sender_id)?.nickname ?? '알수 없는 사용자' }}</h4>
            <span>{{ formatKoreanTime(item.created_at) }}</span>
            <p @click.stop="toggleMenu(item.id)">︙</p>
            <ul v-if="openMenuId === item.id" class="dropdown-menu">
              <li v-if="item.sender_id === authStore.user?.userId">
                <button @click="deleteMessage(item)">삭제</button>
              </li>
              <li v-else>
                <button @click="reportMessage">신고</button>
              </li>
            </ul>
          </div>
          <div v-if="item.isfile === 1">
            <img :src="getImageUrl(item)" class="chat-image" />
          </div>
          <p v-else>{{ item.content }}</p>
        </div>
      </div>
      <div v-if="previewUrl" class="image-preview">
        <img :src="previewUrl" class="chat-image" />
        <button @click="cancelImage">❌</button>
      </div>
      <div class="message-form">
        <button @click="selectFile" class="primary-button">+</button>
        <form @submit.prevent="sendMessage">
          <input v-model="input" type="text" placeholder="Enter를 눌러 전송" class="primary-input" />
        </form>
      </div>
      <input type="file" ref="fileInput" @change="handleFileChange" style="display:none" />
    </section>
    <section class="users-container">
      <div class="title">
        <h3>참가자 목록</h3>
        <CirclePlus class="icon" @click="isInviteModalOpen = true" @click.stop />
      </div>
      <div class="users-list">
        <div v-for="user in targetRoom?.room_users" class="user" @click="selectedUserId = user.user_id">
          <div class="user-avatar">
            <img :src="profileImage.getUrl(user?.profileUrlName)" />
          </div>
          <Crown v-if="user.user_id == targetRoom?.owner_user_id" :size="20" color="#FFD700" />
          <div class="user-info">
            <h5>{{ user.nickname }}</h5>
            <span>{{ user.username }}</span>
          </div>
          <p @click="toggleUserMenu(user.id, $event)" @click.stop>︙</p>
          <ul v-if="openedMenuId === user.id" :style="dropdownStyle" class="dropdown-menu">
            <li>
              <button @click="handleKick(user)" @click.stop>강퇴</button>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>

  <Teleport to="body">
    <UserPopup
      v-if="selectedUserId"
      :userId="selectedUserId"
      @close="selectedUserId = null"
    />

    <InviteModal 
      v-if="isInviteModalOpen"
      :roomId="roomId"
      :alreadyJoinedUsers="targetRoom?.room_users || []"
      @close="isInviteModalOpen = false"
      @invited="handleInvited"
    />
  </Teleport>
</template>