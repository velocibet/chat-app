<script lang="ts" setup>
import auth from '~/middleware/auth';

const userApi = useUserApi();
const router = useRouter();
const authStore = useAuthStore();

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
    
    const me = await userApi.getMe();
    if (me.success) {
        authStore.setUser(me.data);
        router.push('/chat');
    } else {
        alert(me.message);
    }
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