<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const from = route.query.from

function goPush(url: string) {
  router.push({
    path: `/settings${url}`,
    query: route.query
  })
}

function goBack() {
  if (typeof from === 'string') {
    router.push(decodeURIComponent(from))
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="setting-menu">
    <div class="menu-header">
      <button class="back-btn" @click="goBack">
        <span class="icon">←</span> 이전으로
      </button>
    </div>

    <nav class="menu-nav">
      <p class="menu-label">계정 설정</p>
      <ul class="menu-list">
        <li>
          <button @click="goPush('')" :class="['menu-item', { active: route.path === '/settings' }]">
            <span class="item-icon">⚙️</span> 기본 설정
          </button>
        </li>
        <li>
          <button @click="goPush('/profile')" :class="['menu-item', { active: route.path === '/settings/profile' }]">
            <span class="item-icon">👤</span> 프로필 설정
          </button>
        </li>
        <li>
          <button @click="goPush('/security')" :class="['menu-item', { active: route.path === '/settings/security' }]">
            <span class="item-icon">🔒</span> 보안 설정
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>
