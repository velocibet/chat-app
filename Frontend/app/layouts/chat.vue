<script lang="ts" setup>
import '@/assets/css/chat-layout.css';

const sidebarVisible = ref(false);

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value;
}
</script>

<template>
  <div class="chat-layout">
    <UserCheck />

    <!-- 모바일 전용 토글 버튼 -->
    <button class="mobile-toggle" @click="toggleSidebar">
      ☰
    </button>

    <aside class="chat-aside" :class="{ open: sidebarVisible }">
      <UserList />
    </aside>

    <main>
      <slot />
    </main>
  </div>
</template>
