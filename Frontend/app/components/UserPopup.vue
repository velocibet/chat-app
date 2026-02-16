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
const props = defineProps<props>();
    const emit = defineEmits<{
  (e: 'close'): void;
}>();

const popupRef = ref<HTMLElement | null>(null);
const userInfo = ref<User | null>(null);
const isOpen = ref(false);

const menuItems = [
  { label: '친구 삭제', action: deleteFriend },
  { label: '차단하기', action: blockFriend },
];

async function getUser() {
    const res: ApiResponse<User> = await userApi.getOtherProfile(props.userId);

    if (res.success) {
        userInfo.value = res.data;
    }
}

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
  document.addEventListener('click', handleClickOutside);
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
})
</script>

<template>
    <div class="popup-overlay">
        <div class="user-popup" ref="popupRef">
            <div v-if="userInfo" class="user-info">
                <button @click="isOpen = !isOpen" class="dropdown-button">
                    ︙
                </button>
                <ul v-if="isOpen" class="dropdown-menu">
                    <li v-for="item in menuItems" :key="item.label">
                        <button @click="item.action(); isOpen = false">
                            {{ item.label }}
                        </button>
                    </li>
                </ul>
                <div class="title">
                    <img :src="profileImage.getUrl(userInfo?.profileUrlName)"/>
                    <div class="description">
                        <h4>{{ userInfo?.nickname }}</h4>
                        <span>{{ userInfo?.username }}</span>
                    </div>
                </div>
                <div class="choice">
                    <button class="primary-button" @click="getChat">채팅</button>
                    <button class="primary-button" @click="getFriend">친구 추가</button>
                </div>
                <span v-if="userInfo?.bio" class="bio">{{ userInfo?.bio }}</span>
                <span v-else class="no-bio">자기소개가 없습니다.</span>
            </div>
            <div v-else>
                <div class="spinner"></div>
                <p>유저 정보를 불러오고 있습니다.</p>
            </div>
        </div>
    </div>
</template>