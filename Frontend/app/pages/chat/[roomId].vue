<script setup lang="ts">
import '~/assets/css/chat-room.css';

definePageMeta({
  layout: "chat",
  middleware: ["auth"],
});

const router = useRouter();
const route = useRoute();

const chatApi = useChatApi();
const chatRoomApi = useChatroomApi();
const chatSocket = useChatSocket();
const authStore = useAuthStore();
const profileImage = useProfileImage();

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
const avatarMap = ref<Record<number, string>>({});

// room 변경 감지 및 이벤트 리스너 정리 플래그
let loadMessagesHandler: ((response: any) => void) | null = null;
let newMessageHandler: ((response: any) => void) | null = null;

function selectFile () {
  fileInput.value?.click()
}

async function getRoom() {
  const res: ApiResponse<ChatroomListItem> = await chatRoomApi.getRoom(roomId);

  if (!res.success) {
    alert(res.message);
    return
  }

  targetRoom.value = res.data;

  if (targetRoom.value.type === "dm") {
    const opponent = targetRoom.value.room_users.find((u: RoomUserRow) => u.userId !== authStore.user?.userId);
    
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

onMounted(async() => {
  await getRoom();
  
  try {
    // socket이 연결될 때까지 대기
    await chatSocket.waitForSocket();
    
    await chatSocket.joinRoom(+roomId);
  } catch (error) {
    console.error('채팅방 입장 실패:', error);
    alert(`채팅방 입장 실패: ${error}`);
    return;
  }

  // 메시지 초기화
  messages.value = [];
  isEnd.value = false;

  // socket 인스턴스 가져오기
  const socketInstance = chatSocket.socket;
  if (!socketInstance) {
    alert('소켓 연결 오류');
    return;
  }

  // 이전 이벤트 핸들러 제거
  if (loadMessagesHandler) {
    socketInstance.off('loadMessages', loadMessagesHandler);
  }
  if (newMessageHandler) {
    socketInstance.off('newMessage', newMessageHandler);
  }

  // 새로운 이벤트 핸들러 정의
  loadMessagesHandler = (response: any) => {
    if (!response?.data) {
      return;
    }
    
    const msgs = Array.isArray(response.data) ? response.data : [response.data];
    
    if (msgs.length === 0) {
      isEnd.value = true;
      return;
    }

    // messageContainer 존재 확인
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

  // 이벤트 리스너 등록
  socketInstance.on('loadMessages', loadMessagesHandler);
  socketInstance.on('newMessage', newMessageHandler);

  // 메시지 로드 요청
  chatSocket.loadMessages(+roomId, 30);
});

onUnmounted(() => {
  // 이벤트 리스너 정리
  if (loadMessagesHandler) {
    chatSocket.socket?.off('loadMessages', loadMessagesHandler);
    loadMessagesHandler = null;
  }
  if (newMessageHandler) {
    chatSocket.socket?.off('newMessage', newMessageHandler);
    newMessageHandler = null;
  }

  // room 나가기
  chatSocket.leaveRoom(+roomId);
})


</script>

<template>
  <section class="chat-container">
    <div class="message-title">
      <img v-if="targetRoom?.type === 'dm'" :src="profileImage.getUrl(
        targetRoom.room_users.find((u: RoomUserRow) => u.userId !== authStore.user?.userId)?.profileUrlName
      )"/>
      <img v-else-if="targetRoom?.type === 'group'" :src="profileImage.getUrl(
        targetRoom.room_users.find((u: RoomUserRow) => u.userId === targetRoom?.owner_user_id)?.profileUrlName
      )" />
      <div class="title-content">
        <h4>{{ roomTitle }}</h4>
        <span>대화를 시작해보세요.</span>
      </div>
      <!-- <div class="isOnline">
        <span v-if="isFriendOnline">🟢 온라인</span>
        <span v-else>⛔ 오프라인</span>
      </div> -->
    </div>
    <div class="message-container" ref="messageContainer" @scroll="onScroll">
      <div v-for="(item, index) in messages" :key="item.id" class="message">
        <div v-if="shouldShowHeader(index)" class="message-top">
          <img :src="profileImage.getUrl(
            targetRoom?.room_users.find((u: RoomUserRow) => u.userId === item.sender_id)?.profileUrlName
          )" />
          <h4>{{ targetRoom?.room_users.find((u: RoomUserRow) => u.userId === item.sender_id)?.nickname }}</h4>
          <span>{{ formatKoreanTime(item.created_at) }}</span>
          <p @click.stop="toggleMenu(item.id)">︙</p>
          <div v-if="openMenuId === item.id" class="message-menu" >
            <button v-if="item.sender_id === authStore.user?.userId" @click="deleteMessage(item)">삭제</button>
            <button v-else @click="reportMessage">신고</button>
          </div>
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
        <input v-model="input" type="text" placeholder="메세지 입력" class="primary-input" />
      </form>
    </div>
    <input type="file" ref="fileInput" @change="handleFileChange" style="display:none" />
  </section>
</template>
