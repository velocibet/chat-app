<script setup lang="ts">
import '~/assets/css/chat-layout.css';

interface props {
    userId: string
}

interface user {
    id: number | string
    username: string
    nickname: string
    bio: string
}

const config = useRuntimeConfig();
const props = defineProps<props>();
const userInfo = ref<user | null>(null);
const isOpen = ref(false);

const menuItems = [
  { label: '프로필 보기', action: () => alert('프로필') },
  { label: '친구 삭제', action: () => alert('삭제') },
  { label: '차단하기', action: () => alert('차단') },
];

const closeDropdown = () => {
  isOpen.value = false;
};

const onAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = `${config.public.apiBase}/uploads/profiles/default-avatar.webp`
}

async function getUser() {
    try {
        const res: user = await $fetch(`${config.public.apiBase}/api/users/${props.userId}`, {
            method: 'GET',
            credentials: 'include'
        })

        if (res) {
            userInfo.value = res;
        }
    } catch(err) {
        console.error("유저 정보를 불러오는데 실패했습니다: ", err);
    }
}

async function deleteFriend() {
    
}

onMounted(async () => {
    await getUser();
})
</script>

<template>
    <div class="user-popup">
        <div class="title">
            <img :src="`${config.public.apiBase}/uploads/profiles/${userInfo?.id}.webp`" @error="onAvatarError"/>
            <div>
                <p>{{ userInfo?.nickname }}</p>
                <span>{{ userInfo?.username }}</span>
            </div>
            <button @click="isOpen = !isOpen" class="dropdown-button">
                설정 ⚙️
            </button>
            <ul v-if="isOpen" class="dropdown-menu">
                <li v-for="item in menuItems" :key="item.label">
                    <button @click="item.action(); isOpen = false">
                        {{ item.label }}
                    </button>
                </li>
            </ul>
        </div>
        <span>{{ userInfo?.bio || "자기소개가 없습니다." }}</span>
    </div>
</template>