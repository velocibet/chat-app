<script setup lang="ts">
import { io } from 'socket.io-client';
import { useAlarmStore } from '~/stores/alarm';
import { useAuthStore } from '~/stores/auth';
import '@/assets/css/chat-room.css';
import type { Url } from 'url';

definePageMeta({
  layout: 'chat',
});

const router = useRouter();
const route = useRoute();
const config = useRuntimeConfig();
const authStore = useAuthStore();
const alarmStore = useAlarmStore();

const socket = useState<any>('socket');

interface Message {
  id: string | number;
  room_name: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  status: string;
  created_at: string;
  isfile: 0 | 1;
  fileUrl?: string;
}

const friendId = route.params.userId as string;
const messages = ref<Message[]>([]);
const friendNick = ref<string>('');
const input = ref<string>('');
const messageContainer = ref<HTMLElement | null>(null);
const openMenuId = ref<string | number | null>(null);
const THREE_MINUTES = 3 * 60 * 1000
const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref('')
const pendingImage = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const isSending = ref<boolean | null>(false);

const selectFile = () => {
  fileInput.value?.click()
}

async function fetchImage(item: Message) {
  try {
    const blob: any = await $fetch(`${config.public.apiBase}/api/users/getImage`, {
      method: 'POST',
      credentials: 'include',
      body: {
        messageId: String(item.id),
        fromId: String(item.sender_id),
        toId: String(item.receiver_id)
      },
      responseType: 'blob'
    });

    item.fileUrl = URL.createObjectURL(blob);
  } catch (err) {
    console.error('이미지 로드 실패', err);
  }
}

async function handleFileChange (event: Event) {
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

async function deleteMessage(item: Message) {
  if (!confirm("정말 메세지를 삭제하시겠습니까?")) return;
  closeMenu();
  
  if (item.isfile === 1) {
    try {
      await $fetch(`${config.public.apiBase}/api/users/deleteImage`, {
        method: 'POST',
        credentials: 'include',
        body: {
          messageId: String(item.id),
          fromId: String(authStore.userid),
          toId: String(friendId)
        }
      });

      socket.value.emit('deleteMessage', {
          messageId: item.id,
          userId1 : authStore.userid,
          userId2 : friendId,
          content : item.content
      });
    } catch(err) {
      console.error(err);
      alert("이미지 삭제에 실패했습니다.");
    }
  } else {
    socket.value.emit('deleteMessage', {
        messageId: item.id,
        userId1 : authStore.userid,
        userId2 : friendId,
        content : item.content
    });
  }
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

function friendMiddleware() {
  let isExistingFriend : boolean = false;
  for (const friend of authStore.friends) {
    if (friend.id == Number(friendId)) {
      isExistingFriend = true;
    }
  }

  if (!isExistingFriend) {
    // alert("실제 존재하는 userId가 아니거나, 친구로 등록되지 않은 사용자입니다.");
    router.push('/chat');
  }

  return isExistingFriend
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

async function sendMessage() {
  const isExistingFriend = friendMiddleware()
  if (!isExistingFriend) return

  if (isSending.value === true) return;
  isSending.value = true;

  try {
    if (pendingImage.value) {
      const formData = new FormData()
      formData.append('fromId', String(authStore.userid))
      formData.append('toId', String(friendId))
      formData.append('file', pendingImage.value)

      await $fetch(`${config.public.apiBase}/api/users/sendImage`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      pendingImage.value = null
      previewUrl.value = null
      return
    }

    if (input.value.trim()) {
      socket.value.emit('sendMessage', {
        fromId: authStore.userid,
        toId: friendId,
        content: input.value
      })
      input.value = ''
    }
  } catch (err) {
    console.error('메세지 전송 실패', err)
    alert('메세지 전송에 실패했어요 😢')
  } finally {
    isSending.value = false
  }
}


const onError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = `${config.public.apiBase}/uploads/profiles/default-avatar.webp`;
}

const getAvatarUrl = (item: Message) => {
  if (item.sender_id === authStore.userid) {
    return `${config.public.apiBase}/uploads/profiles/${authStore.userid}.webp` || `${config.public.apiBase}/uploads/profiles/default-avatar.webp`;
  }

  console.log(`${config.public.apiBase}/uploads/profiles/${authStore.friends[item.sender_id]?.id}.webp`)
  
  for (const f of authStore.friends) {
    if (f.id !== item.sender_id) continue;
     return `${config.public.apiBase}/uploads/profiles/${f.id}.webp`
  }

  return `${config.public.apiBase}/uploads/profiles/default-avatar.webp`;
}

async function downScroll() {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
}

onMounted(async() => {
  console.log(socket.value)
  const isExistingFriend = friendMiddleware();
  if (!isExistingFriend) return;

  socket.value.emit('joinDirectRoom', {
    userId1: authStore.userid, userId2: friendId
  });

  socket.value.emit('readMessage', {
    userId1: authStore.userid, userId2: friendId
  });

  socket.value.on('previousMessage', async (msgs : any) => {
    if (!msgs) return;
    messages.value = msgs;

    for (const msg of messages.value) {
      if (msg.isfile === 1) await fetchImage(msg);
    }

    await downScroll();
  })

  socket.value.on('newMessage', async (msg : any) => {
    console.log(msg)
    if (!msg) return;
    if (msg.isfile === 1) await fetchImage(msg);
    messages.value.push(msg);

    await downScroll();

    socket.value.emit('readMessage', {
      userId1: authStore.userid, userId2: friendId
    });
  })

  // 보내는 사람 확인
  for (const fri of authStore.friends){
    if (fri.id == Number(friendId)) friendNick.value = fri.nickname;
  }

  // 알람 수 초기화
  alarmStore.setAlarms(Number(
    friendId
  ), 0);
});

onUnmounted(() => {
  if (!socket.value) return
  socket.value.off('newMessage')
  socket.value.off('previousMessage')
})


</script>

<template>
  <section class="chat-container">
    <div class="message-container" ref="messageContainer">
      <div v-for="(item, index) in messages" :key="item.id" class="message">
        <div v-if="shouldShowHeader(index)" class="message-top">
          <img :src="getAvatarUrl(item)" @error="onError" class="profile-image" />
          <h4>{{ item.sender_id === authStore.userid ? authStore.nickname : friendNick }}</h4>
          <span>{{ formatKoreanTime(item.created_at) }}</span>
          <p @click.stop="toggleMenu(item.id)">︙</p>
          <div v-if="openMenuId === item.id" class="message-menu" >
            <button v-if="item.sender_id === authStore.userid" @click="deleteMessage(item)">삭제</button>
            <button v-else @click="reportMessage">신고</button>
          </div>
        </div>
        <div v-if="item.isfile === 1">
          <img v-if="item.fileUrl" :src="item.fileUrl" class="chat-image" />
          <p v-else>이미지 로딩 중...</p>
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
