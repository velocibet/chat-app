<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import ProfilePopup from '~/components/ProfilePopup.vue';

const authStore = useAuthStore();
const config = useRuntimeConfig();
const showProfile = ref(false);
const router = useRouter();
const route = useRoute();
// --- 아바타 캐싱 ---
const avatarUrl = ref<string>('');

// 내 프로필 불러오기
async function fetchMyAvatar() {
  if (!authStore.userid) return;

  try {
    const res = await fetch(`${config.public.apiBase}/api/users/${authStore.userid}/profile`);
    const data = await res.json();
    avatarUrl.value = `${config.public.apiBase}/uploads/profiles/${data.profileImage}`;
  } catch {
    avatarUrl.value = `${config.public.apiBase}/uploads/profiles/default-avatar.jpg`;
  }
}

// 처음 로드될 때 불러오기
fetchMyAvatar();

async function logout() {
  try {
    await $fetch(`${config.public.apiBase}/api/users/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    authStore.clearUser();
    alert('로그아웃 되었습니다.');
    router.push('/');
  } catch (error) {
    console.error(error);
    alert('로그아웃에 실패했습니다.');
  }
}

function editProfile() {
  // 실제 편집 페이지가 있으면 이동시키자
  router.push('/settings');
}

function goSettings() {
  router.push({
    path: '/settings',
    query: { from: encodeURIComponent(route.fullPath) }
  });
}
</script>

<template>
  <div class="user-info" role="region" aria-label="내 정보">
    <div class="me">
      <div class="user-avatar">
        <img :src="avatarUrl" alt="avatar" />
        </div>
      <div>
        <p class="name" @click="showProfile = true">
          {{ authStore.username }}
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
