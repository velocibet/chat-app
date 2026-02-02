<script lang="ts" setup>
import { useUserApi } from '~/composables/api/useUserApi';

const userApi = useUserApi();
const router = useRouter();

const username = ref<string>('');
const password = ref<string>('');
const email = ref<string>('');

async function getRegister() {
    const res = await userApi.register({
        username: username.value,
        password: password.value,
        email: email.value
    })

    if (!res.success) {
        alert(res.message);
        return;
    }

    alert(res.message);
    router.push('/login');
}
</script>

<template>
    <section class="default-main">
        <div class="form">
            <h1>회원가입</h1>

            <form class="default-form" @submit.prevent="getRegister">
                <div class="form-input">
                    <input class="primary-input" v-model="username" type="text" placeholder="아이디" />
                    <input class="primary-input" v-model="email" type="text" placeholder="이메일" />
                    <input class="primary-input" v-model="password" type="password" placeholder="비밀번호" />
                </div>
                
                <button class="primary-button" type="submit">
                    회원가입
                </button>
            </form>

            <NuxtLink to="/login">이미 계정이 있으신가요?</NuxtLink>
            <NuxtLink to="/privacy">개인정보처리방침</NuxtLink>
        </div>
    </section>
</template>