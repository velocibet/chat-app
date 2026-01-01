<script setup lang="ts">
import { io } from 'socket.io-client';
import { useAlarmStore } from '~/stores/alarm';
import { useAuthStore } from '~/stores/auth';
import '@/assets/css/chat-room.css';

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
}

const friendId = route.params.userId as string;
const messages = ref<Message[]>([]);
const friendNick = ref<string>('');
const input = ref<string>('');
const messageContainer = ref<HTMLElement | null>(null);
const openMenuId = ref<string | number | null>(null);
const THREE_MINUTES = 3 * 60 * 1000

definePageMeta({
  layout: 'chat',
});

const toggleMenu = (id: string | number) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

const closeMenu = () => {
  openMenuId.value = null
}

const deleteMessage = (item: Message) => {
  if (!confirm("정말 메세지를 삭제하시겠습니까?")) return;
  closeMenu();
  socket.value.emit('deleteMessage', {
    messageId: item.id,
    userId1 : authStore.userid,
    userId2 : friendId,
    content : item.content
  })
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
  const isExistingFriend = friendMiddleware();
  if (!isExistingFriend) return;

  socket.value.emit('sendMessage', {
    fromId: authStore.userid, toId: friendId, content: input.value
  });

  input.value = '';
  return;
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
    messages.value = msgs

    await downScroll();
  })

  socket.value.on('newMessage', async (msg : any) => {
    if (!msg) return;
    messages.value.push(msg[0]);

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
        <p>{{ item.content }}</p>
      </div>
    </div>
    <form @submit.prevent="sendMessage">
      <input v-model="input" type="text" placeholder="메세지 입력" class="primary-input" />
      <button type="submit" class="outline-button" >전송</button>
    </form>
  </section>
</template>
