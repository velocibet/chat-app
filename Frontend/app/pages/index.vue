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
  <div class="default-main">
    <div class="main-title">
      <p>v0.2.0-alpha</p>
      <h1><span class="highlight">빠르고 가볍게</span> <br> 연결되는 대화</h1>
      <p>Velcoibet은 빠르고 가벼운 구조로 설계된 실시간 메신저로, <br> 안정적인 연결을 바탕으로 끊김 없는 대화를 제공합니다.</p>

      <div class="main-decision">
        <NuxtLink to="/register" class="outline-button">바로 시작하기</NuxtLink>
        <NuxtLink to="/login" class="primary-button">이미 계정이 있습니다</NuxtLink>
      </div>
    </div>
    <div class="main-description">
      <h2>벨로시벳만의 장점</h2>
      <div class="sections">
        <section>
          <h4>빠른 대화</h4>
          <p>버벅거림 없이 실시간으로 대화를 나눌수 있습니다.</p>
        </section>
        <section>
          <h4>웹 메신저</h4>
          <p>별도의 설치 없이도 대화를 보낼수 있습니다.</p>
        </section>
        <section>
          <h4>파일 공유 (개발중)</h4>
          <p>사진과 문서를 빠르게 공유할수 있습니다.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>