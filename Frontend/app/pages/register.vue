<script setup lang="ts">
import { useUserApi } from '~/composables/api/useUserApi';
import { hexToUint8Array } from '~/utils/e2ee';
import { generateAndLockKeysWithServer } from '~/utils/e2ee';

const userApi = useUserApi();
const router = useRouter();

const username = ref<string>('');
const password = ref<string>('');
const email = ref<string>('');
const privacyChecked = ref<boolean>(false);
const isLoading = ref(false);

async function getRegister() {
    if (isLoading.value) return;

    if (!privacyChecked.value) {
        alert('개인정보처리방침에 동의해주세요.');
        return;
    }

    isLoading.value = true;

    try {
        const clientId = crypto.randomUUID();
        
        const seedRes = await userApi.getRegistrationSeed(clientId);
        if (!seedRes.data?.serverSeed) {
            alert('시드 발급에 실패했습니다. 다시 시도해주세요.');
            return;
        }
        
        const serverSeed = hexToUint8Array(seedRes.data.serverSeed);
        
        const keyData = await generateAndLockKeysWithServer(password.value, serverSeed);
        
        const res = await userApi.register({
            username: username.value,
            password: password.value,
            email: email.value,
            privacyAgreement: privacyChecked.value,

            // 암호화 관련 값
            publicKey: keyData.publicKey,
            encryptedPrivateKey: keyData.encryptedPrivateKey,
            encryptedServerSeed: keyData.encryptedServerSeed,
            encryptionSalt: keyData.salt,
            encryptionIv: keyData.iv,
            seedEncryptionIv: keyData.seedIv,
            clientId: clientId
        });

        if (!res.success) {
            alert(res.message);
            return;
        }

        alert(res.message);
        router.push('/login');
    } catch (error) {
        alert('회원가입 중 오류가 발생했습니다');
    } finally {
        isLoading.value = false;
    }
}

async function verifyEmail() {
    if (!email.value) {
        alert("이메일을 먼저 입력해주세요.");
        return;
    }
    const res = await userApi.sendVerifyEmail(email.value);
    alert(res.message);
}
</script>

<template>
    <section class="auth-page">
        <div class="auth-card fade-up active">
            <div class="auth-header">
                <div class="logo-dot"></div>
                <h1>새로운 시작</h1>
                <p>벨로시벳의 가족이 되어주세요.</p>
            </div>

            <form class="auth-form" @submit.prevent="getRegister">
                <div class="input-group">
                    <label>아이디</label>
                    <input class="auth-input" v-model="username" type="text" placeholder="영문, 숫자 조합" required />
                </div>
                
                <div class="input-group">
                    <label>이메일</label>
                    <div class="input-with-button">
                        <input class="auth-input" v-model="email" type="email" placeholder="example@email.com" required />
                        <button class="inner-button" type="button" @click="verifyEmail">인증</button>
                    </div>
                </div>

                <div class="input-group">
                    <label>비밀번호</label>
                    <input class="auth-input" v-model="password" type="password" placeholder="8자 이상 입력" required />
                </div>

                <div class="input-group agreement-group">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="privacyChecked" />
                        <span>개인정보처리방침에 동의합니다. <NuxtLink to="/privacy" class="policy-link">(보기)</NuxtLink></span>
                    </label>
                </div>
                
                <button class="auth-submit" type="submit" :disabled="isLoading">
                    {{ isLoading ? '처리 중...' : '회원가입 완료' }}
                </button>
            </form>

            <div class="auth-footer">
                <p>이미 계정이 있나요? <NuxtLink to="/login">로그인</NuxtLink></p>
                <NuxtLink to="/privacy" class="privacy-link">개인정보처리방침</NuxtLink>
            </div>
        </div>
    </section>
</template>