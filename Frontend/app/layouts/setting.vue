<script lang="ts" setup>
import '@/assets/css/setting-layout.css';

const sidebarVisible = ref(false);
const route = useRoute();

const routing = ref("/settings" + route.query.from);
onMounted(() => {
  console.log(route.query.from)
})
// 모바일에서 사이드바 열기/닫기
// function toggleSidebar() {
//   sidebarVisible.value = !sidebarVisible.value;
// }
</script>

<template>
  <div class="setting-layout">
    <!-- 모바일 토글 버튼 -->
    <!-- <button class="mobile-toggle" @click="toggleSidebar">☰</button>

    <aside :class="{ 'mobile-open': sidebarVisible }">
      <SettingMenu />
    </aside> -->
    <aside class="setting-aside">
      <SettingMenu />
    </aside>

    <main>
     <slot />
    </main>
  </div>
</template>

