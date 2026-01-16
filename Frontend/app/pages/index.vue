<script lang="ts" setup>
import { watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import '~/assets/css/default-layout.css';
import description01 from '~/assets/images/description01.png';

const authStore = useAuthStore();
const router = useRouter();

// definePageMeta({
//   ssr: true
// })

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

watch(
  () => authStore.username,
  (newVal) => {
    if (newVal) {
      router.push('/chat');
    }
  },
  { immediate: true }
);

onMounted(() => {
  const elements = document.querySelectorAll('.sections section, .fade-in');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    { threshold: 0.2 }
  );

  elements.forEach((el) => observer.observe(el));
  getPosts();
});

</script>

<template>
  <div class="default-main">
    <div class="main-title">
      <p>v0.2.0-alpha</p>
      <h1><span class="highlight">빠르고 가볍게</span> <br> 연결되는 대화</h1>
      <p>Velcoibet은 빠르고 가벼운 구조로 설계된 실시간 메신저로, <br> 안정적인 연결을 바탕으로 끊김 없는 대화를 제공합니다.</p>

      <div class="main-decision">
        <NuxtLink to="/register" class="outline-button">바로 시작하기</NuxtLink>
        <NuxtLink to="/login" class="primary-button">이미 계정이 있습니다</NuxtLink>
      </div>
    </div>

    <hr>

    <div class="main-description">
      <div class="first-section">
        <h2>속도의 한계를 넘는 실시간 연결, Velocibet</h2>
        <p>단순한 메신저를 넘어, 가장 빠르고 가볍게 메시지를 전달하기 위해 설계되었습니다. 불필요한 대기 시간 없이 지금 바로 대화를 시작하세요.</p>
      </div>

      <h2>벨로시벳만의 장점</h2>
      <div class="sections">
        <section class="slide-right">
          <h4>WebSocket 기반의 초저지연 통신</h4>
          <p>클라이언트와 서버가 상시 연결된 상태로 데이터를 주고받아, 메시지 전송 시 발생하는 지연 시간을 최소화했습니다. 별도의 새로고침 없이도 대화 상대방의 메시지를 즉각적으로 수신하며, 실제 대면 대화와 같은 실시간성을 보장합니다.</p>
        </section>
        <section class="slide-right">
          <h4>가벼운 웹 아키텍처</h4>
          <p>별도의 앱 설치 과정 없이 브라우저만 있다면 어디서든 접속 가능합니다. 가벼운 코드 구조로 설계되어 저사양 기기나 불안정한 네트워크 환경에서도 안정적으로 구동됩니다.</p>
        </section>
        <section class="slide-right">
          <h4>고해상도 이미지 공유</h4>
          <p>사진 전송 시 효율적인 데이터 압축 및 최적화 기술을 적용하여, 네트워크 환경에 구애받지 않고 빠르게 이미지를 주고받을 수 있습니다.</p>
        </section>
      </div>
    </div>

    <hr>

    <div class="second-description">
      <div class="content fade-in">
        <h2>"직관적인 UI", "빠른 파일 전송"</h2>
        <p>지금 바로 친구와 연결하고 경험해보세요!</p>
      </div>
      <img :src="description01" class="fade-in">
    </div>

    <hr>

    <div class="blog-container">
      <h2>개발 일지</h2>
      <p>메신저의 자세한 내용이 궁금하시다면 저희 블로그를 방문해주세요! <strong><a href="https://blog.velocibet.com">블로그 바로가기</a></strong> </p>
      <div class="posts">
        <section v-for="item in posts" @click="goToPost(item.id)">
          <h4>{{ item.title }}</h4>
          <p> {{ item.summary }} </p>
          <span>
            {{
              new Date(item.date).getFullYear() + '년 ' +
              (new Date(item.date).getMonth() + 1) + '월 ' +
              new Date(item.date).getDate() + '일'
            }}
          </span>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>