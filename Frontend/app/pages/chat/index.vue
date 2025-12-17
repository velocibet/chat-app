<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { Session } from 'inspector';

const config = useRuntimeConfig();
const authStore = useAuthStore();

const friendName = ref<string>('');
const friends = ref<Friend[]>([]);
const requests = ref<{ userId: string; username: string; nickname: string }[]>([]);

interface Friend {
  username: string;
  nickname: string;
}

definePageMeta({
  layout: 'chat'
});

async function getRequests() {
  try {
    const data : any = await $fetch(`${config.public.apiBase}/api/users/friend-receive`, {
        method: "GET",
        credentials: 'include'
    })

    if (!data) {
      alert("오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    requests.value = data;
  } catch(error : any) {
      alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
  }
}

async function acceptRequests(fi : string) {
  try {
    const data : any = await $fetch(`${config.public.apiBase}/api/users/request-accept`, {
        method: "POST",
        credentials: 'include',
        body: {
          friendId: fi
        }
    })

    if (!data.ok) {
      alert("오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    requests.value = requests.value.filter(req => req.userId !== fi);
    alert("요청을 수락했습니다.");
  } catch(error : any) {
      alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
  }
}

async function rejectRequests(fi : string) {
  try {
    const data : any = await $fetch(`${config.public.apiBase}/api/users/request-reject`, {
        method: "POST",
        credentials: 'include',
        body: {
          friendId: fi
        }
    })

    if (!data.ok) {
      alert("오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    requests.value = requests.value.filter(req => req.userId !== fi);
    alert("요청을 거절했습니다.");
  } catch(error : any) {
      alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
  }
}

async function addFriend() {
  try {
    const data : any = await $fetch(`${config.public.apiBase}/api/users/friend-request`, {
        method: "POST",
        credentials: 'include',
        body: {
          friendName: friendName.value
        }
    })

    if (!data) {
      alert("오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    if (data.status === 'accepted') {
      alert('친구 추가가 완료되었습니다. 새로고침 후 메세지를 보낼수 있습니다.');
    } else if (data.status === 'pending') {
      alert('친구 요청을 전송했습니다.');
    }
  } catch(error : any) {
      alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
  }
}

watchEffect(() => {
  friends.value = authStore.friends;
})

onMounted(() => {
  getRequests();
});

</script>

<template>
  <section class="request-container">
    <h3>친구 추가</h3>
    <form @submit.prevent="addFriend">
      <input class="primary-input" type="text" placeholder="아이디를 입력하세요." v-model="friendName" />
      <button class="primary-button" type="submit">전송</button>
    </form>

    <h3>친구 요청</h3>
    <Session>
      <div class="request-item" v-for="(item, index) in requests" :key="index">
        <div>
          <h5>{{ item.nickname }}</h5>
          <span>{{ item.username }}</span>
        </div>
        <div>
          <button class="outline-button" @click="acceptRequests(item.userId)">수락</button>
          <button class="primary-button" @click="rejectRequests(item.userId)">거절</button>
        </div>
      </div>
    </Session>

    <h3>친구 목록</h3>
    <div v-for="(item, index) in friends" :key="index">
      <p>{{ item.username }}</p>
    </div>
  </section>
</template>