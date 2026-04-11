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
        console.log('[Register] Step 1: Creating clientId...');
        const clientId = crypto.randomUUID();
        console.log('[Register] clientId:', clientId);
        
        console.log('[Register] Step 2: Getting registration seed...');
        const seedRes = await userApi.getRegistrationSeed(clientId);
        if (!seedRes.data?.serverSeed) {
            alert('시드 발급에 실패했습니다. 다시 시도해주세요.');
            return;
        }
        console.log('[Register] Seed received. Length:', seedRes.data.serverSeed.length);
        
        console.log('[Register] Step 3: Converting hex to Uint8Array...');
        const serverSeed = hexToUint8Array(seedRes.data.serverSeed);
        console.log('[Register] Seed converted. Length:', serverSeed.length);
        
        console.log('[Register] Step 4: Generating and locking keys...');
        const keyData = await generateAndLockKeysWithServer(password.value, serverSeed);
        console.log('[Register] Keys generated and locked');

        console.log('[Register] Step 5: Sending register request...');
        const res = await userApi.register({
            username: username.value,
            password: password.value,
            email: email.value,
            privacyAgreement: privacyChecked.value,

            // 암호화 관련 값
            publicKey: keyData.publicKey,
            encryptedPrivateKey: keyData.encryptedPrivateKey,
            encryptionSalt: keyData.salt,
            encryptionIv: keyData.iv,
            clientId: clientId
        });

        if (!res.success) {
            alert(res.message);
            return;
        }

        alert(res.message);
        router.push('/login');
    } catch (error) {
        console.error('[Register] Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : 'No stack trace';
        console.error('[Register] Stack:', errorStack);
        alert('회원가입 중 오류가 발생했습니다: ' + errorMessage);
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