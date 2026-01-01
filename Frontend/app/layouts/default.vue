<script setup lang="ts">
import '~/assets/css/default-layout.css';
</script>

<template>
  <div class="default-layout">
    <header class="default-header">
      <nav class="default-nav">
        <div class="nav-left">
          <NuxtLink to="/">Velocibet</NuxtLink>
        </div>
        <div class="nav-right">
          <NuxtLink to="/login">로그인</NuxtLink>
          <NuxtLink to="/register">회원가입</NuxtLink>
        </div>
      </nav>
      <hr>
    </header>

    <!-- <UserCheck /> -->

    <main class="site-main">
      <slot />
    </main>

    <footer class="default-footer">
      <div class="footer-about">
        <h4>메신저</h4>
        <p>최고의 편리함을 제공하는 메신저.</p>
      </div>

      <div class="footer-links">
        <a href="/privacy">개인정보처리방침</a>
      </div>

      <div class="footer-contact">
        <p>© 2026 Velocibet</p>
        <div class="social">
          <a href="https://x.com/velocibet" aria-label="twitter">Twitter</a>
          <a href="https://github.com/velocibet/chat-app" aria-label="Github">Github</a>
        </div>
      </div>
    </footer>
  </div>
</template>