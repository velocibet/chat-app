<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';
import { io, Socket } from 'socket.io-client';

const config = useRuntimeConfig();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const socket = useState<any>('socket', () => null);

async function connectSocket(userid: string) {
  socket.value = io(config.public.wsBase, {
    query: { userId: userid },
  });

  socket.value.on('friendAccepted', (body : any) => {
    authStore.addFriend(body);
  });
}

async function checkLogin() {
    try {
        const data : any = await $fetch(`${config.public.apiBase}/api/users/checklogin`, {
            method: "GET",
            credentials: 'include'
        })

        if (!data) {
            return
        }

        const user = data?.user;
        const friendList = data?.friendList;

        if (user?.userid) {
            authStore.setUser(user.username, user.userid, user.nickname, friendList);
            if (route.path === '/') {
                router.push('/chat');
            }
            return;
        }
        router.push('/');
    } catch(error : any) {
        alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
        router.push('/');
    }
}
    
onMounted(async () => {
  await checkLogin();

  // userid가 들어온 "이후"에 연결
  watch(
    () => authStore.userid,
    (userid) => {
      if (userid && !socket.value) {
        connectSocket(String(userid));
        }
    },
    { immediate: true }
  );
});
</script>

<template>
    
</template>