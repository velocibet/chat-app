<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isScrolled = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="default-layout">
    <header class="default-header" :class="{ 'is-scrolled': isScrolled }">
      <nav class="default-nav">
        <div class="nav-left">
          <NuxtLink to="/" class="logo">
            <span class="logo-dot"></span>
            벨로시벳
          </NuxtLink>
        </div>
        <div class="nav-right">
          <NuxtLink to="/login" class="nav-link">로그인</NuxtLink>
          <NuxtLink to="/register" class="nav-cta">시작하기</NuxtLink>
        </div>
      </nav>
    </header>

    <main class="site-main">
      <slot />
    </main>

    <footer class="default-footer">
      <div class="footer-top">
        <div class="footer-brand">
          <h4 class="footer-logo">벨로시벳</h4>
          <p>속도의 한계를 넘는<br>실시간 연결 서비스</p>
        </div>

        <div class="footer-group">
          <h5>서비스</h5>
          <NuxtLink to="/chat">채팅하기</NuxtLink>
          <a href="https://blog.velocibet.com">개발 블로그</a>
        </div>

        <div class="footer-group">
          <h5>정책</h5>
          <NuxtLink to="/privacy">개인정보처리방침</NuxtLink>
          <NuxtLink to="/terms">이용약관</NuxtLink>
        </div>

        <div class="footer-group">
          <h5>커뮤니티</h5>
          <a href="https://x.com/velocibet" target="_blank">Twitter</a>
          <a href="https://github.com/velocibet/chat-app" target="_blank">Github</a>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© 2026 Velocibet. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>