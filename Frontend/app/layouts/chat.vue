<script lang="ts" setup>
import '@/assets/css/chat-layout.css';

const sidebarVisible = ref(false);

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value;
}

const clearBadgeAndNotifications = async () => {
  // 1. 배지 API 호출 (지원되는 경우)
  if ('setAppBadge' in navigator) {
    await (navigator as any).setAppBadge(0);
  }

  // 2. 서비스 워커를 통해 현재 활성화된 알림들 닫기
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      // 해당 서비스 워커가 띄운 모든 알림 목록을 가져와서 닫음
      const notifications = await registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }
};

onMounted(() => {
  clearBadgeAndNotifications();
  window.addEventListener('focus', clearBadgeAndNotifications);
});
</script>

<template>
  <div class="chat-layout">
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
