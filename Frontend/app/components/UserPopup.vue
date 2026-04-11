<script setup lang="ts">
import '~/assets/css/chat-layout.css';

interface props {
    userId: number
}

const router = useRouter();
const userApi = useUserApi();
const friendsApi = useFriendsApi();
const chatRoomApi = useChatroomApi();
const profileImage = useProfileImage();
const { onUserStatusChanged, offUserStatusChanged } = useChatSocket();
const props = defineProps<props>();
    const emit = defineEmits<{
  (e: 'close'): void;
}>();

const popupRef = ref<HTMLElement | null>(null);
const userInfo = ref<User | null>(null);
const isOpen = ref(false);
const isOnline = ref(false);

const menuItems = [
  { label: '친구 삭제', action: deleteFriend },
  { label: '차단하기', action: blockFriend },
];

async function getUser() {
    const res: ApiResponse<User> = await userApi.getOtherProfile(props.userId);

    if (res.success) {
        userInfo.value = res.data;
        isOnline.value = res.data.isOnline || false;
    }
}

const handleStatusChange = (data: { userId: number, isOnline: boolean }) => {
  if (data.userId === props.userId) {
    isOnline.value = data.isOnline;
  }
};

async function deleteFriend() {
    const check = confirm("정말 친구를 삭제하시겠습니까?");

    if (!check) return;
    if (!userInfo.value) return;
    const res: ApiResponse = await friendsApi.removeFriend(userInfo.value.username);

    alert(res.message);
}

async function blockFriend() {
    const check = confirm("정말 해당 유저를 차단하시겠습니까?");

    if (!check) return;
    if (!userInfo.value) return;
    const res: ApiResponse = await friendsApi.blockUser(userInfo.value.username);

    alert(res.message);
}

async function getChat() {
    const res: ApiResponse = await chatRoomApi.createRoom({
        type: 'dm',
        member: userInfo.value?.userId
    })

    if (!res.success) {
        alert(res.message);
        return
    };

    const roomId = res.data;
    router.push(`/chat/${roomId}`);
}

async function getFriend() {
    const res: ApiResponse = await friendsApi.requestFriend({
        receiverUsername: userInfo.value?.nickname!
    });

    alert(res.message);
}

const handleClickOutside = (event: MouseEvent) => {
  if (popupRef.value && !popupRef.value.contains(event.target as Node)) {
    emit('close');
  }
}

onMounted(async () => {
  await getUser();
  onUserStatusChanged(handleStatusChange);
  document.addEventListener('click', handleClickOutside);
})

onUnmounted(() => {
  offUserStatusChanged(handleStatusChange);
  document.removeEventListener('click', handleClickOutside);
})
</script>

<template>
    <div class="popup-overlay">
        <div class="user-popup" ref="popupRef" @click.stop>
            <div v-if="userInfo" class="user-card">
                <div class="card-header">
                    <button @click="isOpen = !isOpen" class="menu-trigger">︙</button>
                    <Transition name="fade">
                        <ul v-if="isOpen" class="popup-dropdown">
                            <li v-for="item in menuItems" :key="item.label">
                                <button @click="item.action(); isOpen = false">{{ item.label }}</button>
                            </li>
                        </ul>
                    </Transition>
                </div>

                <div class="profile-section">
                    <div class="avatar-wrapper">
                        <img :src="profileImage.getUrl(userInfo?.profileUrlName)" class="main-avatar"/>
                        <div :class="['status-indicator', isOnline ? 'online' : 'offline']"></div>
                    </div>
                    <div class="user-titles">
                        <h3>{{ userInfo?.nickname }}</h3>
                        <span class="username">@{{ userInfo?.username }}</span>
                        <span :class="['status-text', isOnline ? 'online' : 'offline']">
                            {{ isOnline ? '현재 온라인' : '오프라인' }}
                        </span>
                    </div>
                </div>

                <div class="bio-section">
                    <p v-if="userInfo?.bio" class="bio-text">{{ userInfo?.bio }}</p>
                    <p v-else class="no-bio">등록된 자기소개가 없습니다.</p>
                </div>

                <div class="action-group">
                    <button class="action-btn chat-btn" @click="getChat">
                        메시지 보내기
                    </button>
                    <button class="action-btn add-btn" @click="getFriend">
                        친구 추가
                    </button>
                </div>
            </div>

            <div v-else class="popup-loading">
                <div class="spinner"></div>
                <p>프로필을 불러오는 중...</p>
            </div>
        </div>
    </div>
</template>