<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const config = useRuntimeConfig();
const router = useRouter();

interface CheckLoginResponse {
    loggedIn: boolean
    username?: string
    nickname?: string
    userid?: string
}

async function checkLogin() {
    try {
        const { data, error } = await useFetch<CheckLoginResponse>(`${config.public.apiBase}/api/users/checklogin`, {
            method: "GET",
            credentials: 'include'
        })

        if (error.value) {
            console.log(error.value);
            router.push("/");
            return
        }

        if(data.value?.loggedIn && data.value?.username && data.value?.userid && data.value?.nickname) { //data.value?.nickname
            authStore.setUser(data.value.username, data.value.userid, data.value.nickname); // data.value.nickname
        }
    } catch (err) {
        console.error(err);
        router.push("/");
    }
}
    
onMounted(() => {
    checkLogin();
})
</script>

<template>
    
</template>