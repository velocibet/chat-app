<script lang="ts" setup>
import { watch } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const router = useRouter();

// definePageMeta({
//   ssr: true
// })

watch(
  () => authStore.username,
  (newVal) => {
    if (newVal) {
      router.push('/chat');
    }
  },
  { immediate: true }
);
</script>

<template>
  <section class="default-main">
    <div class="main-title">
      <h1>벨로시벳</h1>
      <p>지금 이 순간을 잇는 메신저.</p>
    </div>
    <div class="main-decision">
      <NuxtLink to="/login" class="primary-button">로그인</NuxtLink>
      <NuxtLink to="/register" class="outline-button">회원가입</NuxtLink>
    </div>
  </section>
</template>

<style scoped>

</style>