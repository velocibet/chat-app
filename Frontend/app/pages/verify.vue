<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const userApi = useUserApi();

const status = ref<'loading' | 'success' | 'error'>('loading');
const errorMessage = ref('');

definePageMeta({
  layout: false,
});

onMounted(async () => {
  const token = route.query.token as string | undefined;

  if (!token) {
    status.value = 'error';
    errorMessage.value = '잘못된 인증 링크입니다.';
    return;
  }

  const res = await userApi.verifyEmailToken(token);
  if (res.success) status.value = 'success';
  if (!res.success) {
    status.value = 'error';
    errorMessage.value = res.message;
  };


});

const goHome = () => {
  router.push('/');
};
</script>


<template>
  <div class="verify-container">
    <div v-if="status === 'loading'">
      <h2>이메일 인증 중입니다…</h2>
      <p>잠시만 기다려주세요.</p>
    </div>

    <div v-else-if="status === 'success'">
      <h2>✅ 이메일 인증 완료</h2>
      <p>이제 회원가입을 계속 진행하실 수 있어요.</p>
    </div>

    <div v-else-if="status === 'error'">
      <h2>❌ 이메일 인증 실패</h2>
      <p>{{ errorMessage }}</p>

      <button @click="goHome">
        홈으로 이동
      </button>
    </div>
  </div>
</template>