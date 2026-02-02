<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';

const AuthStore = useAuthStore();

definePageMeta({
  layout: "setting",
  middleware: ["auth"],
});

</script>

<template>
  <div class="setting-page">
    <h1>기본 설정</h1>
    <p v-if="AuthStore.user?.username">현재 사용자 아이디는 {{ AuthStore.user.username }}입니다.</p>
    <p v-else>로그인을 해주세요.</p>
  </div>
</template>