<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import '~/assets/css/default-layout.css';
import description01 from '~/assets/images/description01.png';

const authStore = useAuthStore();
const router = useRouter();
const posts = ref<any>([]);

async function getPosts() {
    try {
      const data : any = await $fetch("https://blog.velocibet.com/config.json");
      if (!data) return;
      data.posts.forEach((post: any) => {
        if (post.category === "devlog") posts.value.push(post);
      })
    } catch(err) {
      console.error(err);
    }
}

function goToPost(id : string){
  window.location.href = `https://blog.velocibet.com/post.html?id=${id}`;
}

onMounted(() => {
  const elements = document.querySelectorAll('.fade-up, .slide-in');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    { threshold: 0.1 }
  );
  elements.forEach((el) => observer.observe(el));
  getPosts();
});
</script>

<template>
  <div class="default-main">
    <section class="hero-section">
      <div class="hero-content fade-up">
        <div class="version-badge">v0.3.0-alpha</div>
        <h1><span class="highlight">빠르고 가볍게</span><br>연결되는 대화</h1>
        <p>Velocibet은 불필요한 무게를 덜어내고 오직 본질에 집중합니다.<br>기기에 상관없이 브라우저만 있다면 지금 바로 시작하세요.</p>
        <div class="hero-btns">
          <NuxtLink to="/register" class="cta-button primary">지금 바로 시작하기</NuxtLink>
          <NuxtLink to="/login" class="cta-button outline">이미 계정이 있습니다</NuxtLink>
        </div>
      </div>
      <div class="hero-visual fade-up">
        <div class="mockup-container">
          <img :src="description01" alt="App Preview" class="app-mockup">
          <div class="floating-badge notification">
            <div class="icon">🔔</div>
            <div class="text">
              <strong>실시간 알림</strong>
              <span>새로운 메시지가 도착했습니다</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">0.1s</span>
        <span class="stat-label">지연 없는 채팅</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">99.9%</span>
        <span class="stat-label">무중단 서비스</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">PWA</span>
        <span class="stat-label">설치 없는 사용</span>
      </div>
    </section>

    <section class="feature-grid">
      <h2 class="section-title fade-up">벨로시벳이 특별한 이유</h2>
      <div class="grid-container">
        <div class="feature-card slide-in">
          <div class="card-icon">⚡</div>
          <h4>빠른 실시간 채팅</h4>
          <p>새로고침 없이 바로바로 전달되는 메시지. 끊김 없이 이어지는 대화를 경험하세요.</p>
        </div>
        <div class="feature-card slide-in" style="transition-delay: 0.1s">
          <div class="card-icon">📱</div>
          <h4>앱처럼 쓰는 웹</h4>
          <p>설치할 필요 없이 홈 화면에 추가만 하면 끝. 푸시 알림까지 지원하는 앱 같은 사용성.</p>
        </div>
        <div class="feature-card slide-in" style="transition-delay: 0.2s">
          <div class="card-icon">🖼️</div>
          <h4>선명한 사진 공유</h4>
          <p>화질은 그대로, 용량은 가볍게. 고화질 사진도 부담 없이 주고받을 수 있어요.</p>
        </div>
      </div>
    </section>

    <section class="pwa-guide-section fade-up">
      <div class="pwa-guide-content">
        <h2>스토어 대신 홈 화면으로</h2>
        <p>복잡한 가입과 다운로드 없이 링크 공유만으로 대화를 시작하세요. PWA 기술로 제작되어 브라우저 어디서나 강력합니다.</p>
        <span class="description">*아래 방법은 Chrome 브라우저 기준입니다.</span>
        <div class="guide-steps">
          <div class="step"><span>1</span> 오른쪽 위 점 세개 클릭</div>
          <div class="step"><span>2</span> 홈 화면에 추가</div>
          <div class="step"><span>3</span> 앱 설치</div>
        </div>
      </div>
    </section>

    <section class="blog-section fade-up">
      <div class="section-header">
        <h2>개발 일지</h2>
        <a href="https://blog.velocibet.com" class="text-link">전체 보기 →</a>
      </div>
      <div class="blog-grid">
        <div v-for="item in posts.slice(0, 3)" :key="item.id" class="blog-card" @click="goToPost(item.id)">
          <span class="post-date">{{ new Date(item.date).toLocaleDateString() }}</span>
          <h4>{{ item.title }}</h4>
          <p>{{ item.summary }}</p>
        </div>
      </div>
    </section>

    <section class="final-cta fade-up">
      <h2>지금 바로 대화를 시작해볼까요?</h2>
      <NuxtLink to="/register" class="cta-button primary large">벨로시벳 시작하기</NuxtLink>
    </section>
  </div>
</template>