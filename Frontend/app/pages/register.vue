<script lang="ts" setup>
    const router = useRouter();
    const config = useRuntimeConfig();

    const username = ref<string>('');
    const password = ref<string>('');
    const email = ref<string>('');

    async function getRegister() {
        try {
            const data : any = await $fetch(`${config.public.apiBase}/api/users/register`, {
                method: "POST",
                body: {
                    username: username.value,
                    password: password.value,
                    email: email.value
                }
            });

            alert(`환영합니다 ${data.username}님, 로그인 페이지로 이동합니다.`);
            router.push("/login");
        } catch(error : any) {
            alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
        }
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