<script setup lang="ts">
const config = useRuntimeConfig();
const userApi = useUserApi();
const authStore = useAuthStore();
const profileImage = useProfileImage();
const { disconnect } = useSocket();

const showProfile = ref(false);
const router = useRouter();
const route = useRoute();

async function logout() {
  await disconnect();

  const res = await userApi.logout();

  if (!res.success) {
    alert(res.message);
    return;
  }

  alert(res.message);
  router.push("/");
}
</script>

<template>
  <div class="user-info" role="region" aria-label="내 정보">
    <div class="me">
      <div class="user-avatar">
        <img :src="profileImage.getUrl(authStore.user?.profileUrlName)" alt="avatar" />
        </div>
      <div>
        <p class="name" @click="showProfile = true">
          {{ authStore.user?.nickname! }}
        </p>
        <p class="condition">온라인</p>
      </div>
    </div>

    <div class="logout" @click="logout">
      로그아웃
    </div>
  </div>
</template>