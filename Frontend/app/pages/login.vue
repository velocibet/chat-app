<script setup lang="ts">
import { useUserApi } from '~/composables/api/useUserApi';
import { useAuthStore } from '~/stores/auth';
import { usePushNotification } from '~/composables/usePushNotification';

const userApi = useUserApi();
const router = useRouter();
const authStore = useAuthStore();
const { requestAndSaveToken } = usePushNotification();

const username = ref<string>('');
const password = ref<string>('');
const isLoading = ref(false);

async function getLogin() {
    if (isLoading.value) return;
    isLoading.value = true;
    
    try {
        const res = await userApi.login({
            username: username.value,
            password: password.value
        });

        if (!res.success) {
            alert(res.message);
            return;
        }
        
        const me = await userApi.getMe();
        if (me.success) {
            authStore.setUser(me.data);
            await requestAndSaveToken();
            router.push('/chat');
        } else {
            alert(me.message);
        }
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <section class="auth-page">
        <div class="auth-card fade-up active">
            <div class="auth-header">
                <div class="logo-dot"></div>
                <h1>다시 연결할까요?</h1>
                <p>벨로시벳 계정으로 로그인을 진행합니다.</p>
            </div>

            <form class="auth-form" @submit.prevent="getLogin">
                <div class="input-group">
                    <label>아이디</label>
                    <input class="auth-input" v-model="username" type="text" placeholder="아이디를 입력하세요" required />
                </div>
                <div class="input-group">
                    <label>비밀번호</label>
                    <input class="auth-input" v-model="password" type="password" placeholder="비밀번호를 입력하세요" required />
                </div>
                
                <button class="auth-submit" type="submit" :disabled="isLoading">
                    {{ isLoading ? '로그인 중...' : '로그인' }}
                </button>
            </form>
            
            <div class="auth-footer">
                <p>계정이 없으신가요? <NuxtLink to="/register">회원가입</NuxtLink></p>
            </div>
        </div>
    </section>
</template>