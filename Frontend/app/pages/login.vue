<script lang="ts" setup>
import { useUserApi } from '~/composables/api/useUserApi';
import { useAuthStore } from '#imports';

const userApi = useUserApi();
const authStore = useAuthStore();
const router = useRouter();

const username = ref<string>('');
const password = ref<string>('');

async function getLogin() {
    const res = await userApi.login({
        username: username.value,
        password: password.value
    })

    if (!res.success) {
        alert(res.message);
        return
    }

    authStore.setUser(res.data);
    router.push('/chat');
}
</script>

<template>
    <section class="default-main">
        <div class="form">
            <h1>로그인</h1>

            <form class="default-form" @submit.prevent="getLogin">
                <div class="form-input">
                    <input class="primary-input" v-model="username" type="text" placeholder="아이디" />
                    <input class="primary-input" v-model="password" type="password" placeholder="비밀번호" />
                </div>
                
                <button class="primary-button" type="submit">
                    로그인
                </button>
            </form>
            
            <NuxtLink to="/register">아직 계정이 없으신가요?</NuxtLink>
        </div>
    </section>
</template>