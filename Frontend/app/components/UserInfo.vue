<script setup lang="ts">
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '~/stores/auth';
import ProfilePopup from '~/components/ProfilePopup.vue';

const authStore = useAuthStore();
const config = useRuntimeConfig();
const showProfile = ref(false);
const router = useRouter();
const route = useRoute();
const avatarUrl = ref<string>('');

const socket = useState<any>('socket');

async function logout() {
  if (socket.value) {
    socket.value.disconnect();
    socket.value = null;
  }

  try {
    const data : any = await $fetch(`${config.public.apiBase}/api/users/logout`, {
      method: 'GET',
      credentials: 'include'
    });

    authStore.clearUser();
    alert(data.message);
    router.push('/');
  } catch(error : any) {
    alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
  }
}

async function checkProfileImage() {
  try {
    const data : any = await $fetch(`${config.public.apiBase}/api/users/checkProfileImage`, {
      method: 'GET',
      credentials: 'include'
    });

    if (data.existingImage) {
      if (!authStore.userid) {
        avatarUrl.value = `${config.public.apiBase}/uploads/profiles/default-avatar.webp`
      }
      watchEffect(() => {
        avatarUrl.value = `${config.public.apiBase}/uploads/profiles/${authStore.userid}.webp`
      })
    } else {
      avatarUrl.value = `${config.public.apiBase}/uploads/profiles/default-avatar.webp`
    }
  } catch(error : any) {
    avatarUrl.value = `${config.public.apiBase}/uploads/profiles/default-avatar.webp`
    alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
  }
}

function editProfile() {
  router.push('/settings');
}

function goSettings() {
  router.push({
    path: '/settings',
    query: { from: encodeURIComponent(route.fullPath) }
  });
}

onMounted(() => {
  checkProfileImage();
})
</script>

<template>
  <div class="user-info" role="region" aria-label="내 정보">
    <div class="me">
      <div class="user-avatar">
        <img :src="avatarUrl" alt="avatar" />
        </div>
      <div>
        <p class="name" @click="showProfile = true">
          {{ authStore.nickname }}
        </p>
        <p class="condition">온라인</p>
      </div>
    </div>

    <div class="logout" @click="logout">
      로그아웃
    </div>

    <ProfilePopup
      v-model="showProfile"
      :username="authStore.username || ''"
      :bio="'자기소개가 없습니다.'"
      @edit="goSettings"
    />
  </div>
</template>
