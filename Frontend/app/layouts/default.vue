<script setup lang="ts">
import '~/assets/css/default-layout.css';
</script>


<template>
  <div class="default-layout">
    <header class="default-header">
      <nav class="default-nav">
        <div class="nav-left">
          <NuxtLink to="/">벨로시벳</NuxtLink>
        </div>
        <div class="nav-right">
          <NuxtLink to="/login">로그인</NuxtLink>
          <NuxtLink to="/register">회원가입</NuxtLink>
        </div>
      </nav>
    </header>

    <!-- <UserCheck /> -->

    <main class="site-main">
      <slot />
    </main>

    <footer class="default-footer">
      <div class="footer-about">
        <h4>벨로시벳</h4>
        <p>빠르고 가볍게 연결되는 대화</p>
      </div>

      <div class="footer-links">
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용 약관</a>
      </div>

      <div class="footer-contact">
        <p>© 2026 Velocibet</p>
        <div class="social">
          <a href="https://x.com/velocibet" aria-label="twitter">Twitter</a>
          <a href="https://github.com/velocibet/chat-app" aria-label="Github">Github</a>
          <a href="https://blog.velocibet.com/" aria-label="Github">Blog</a>
        </div>
      </div>
    </footer>
  </div>
</template>