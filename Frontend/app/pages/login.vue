<script setup lang="ts">
import { useUserApi } from '~/composables/api/useUserApi';
import { useAuthStore } from '~/stores/auth';
import { usePushNotification } from '~/composables/usePushNotification';
import { hexToUint8Array, arrayToBase64, unlockPrivateKey, deriveMasterKey } from '~/utils/e2ee';

const userApi = useUserApi();
const router = useRouter();
const authStore = useAuthStore();
const secretStore = useSecretStore();
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

        try {
            let oldServerSeed: Uint8Array;
            
            if (!res.data.security.oldServerSeed) {
                const recoveryData = await new Promise<any>((resolve) => {
                    const request = window.indexedDB.open("SecureMessengerDB", 1);
                    request.onsuccess = (e: any) => {
                        const db = e.target.result;
                        const tx = db.transaction("secure_store", "readonly");
                        const getRequest = tx.objectStore("secure_store").get("encrypted_bundle");
                        getRequest.onsuccess = () => {
                            resolve(getRequest.result);
                        };
                        getRequest.onerror = () => resolve(null);
                    };
                    request.onerror = () => resolve(null);
                });

                if (!recoveryData || !recoveryData.serverSeed) {
                    throw new Error("Cannot recover from expired seed. Please contact support.");
                }

                oldServerSeed = hexToUint8Array(recoveryData.serverSeed);
            } else {
                oldServerSeed = hexToUint8Array(res.data.security.oldServerSeed);
            }

            const decryptedPrivateKey = await unlockPrivateKey({
                encryptedPrivateKey: res.data.security.encryptedPrivateKey,
                salt: res.data.security.encryptionSalt,
                iv: res.data.security.encryptionIv,
            }, password.value, oldServerSeed);

            const newServerSeed = hexToUint8Array(res.data.security.newServerSeed);

            const exportedPrivateKey = await window.crypto.subtle.exportKey('pkcs8', decryptedPrivateKey);

            const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
            const newIv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const newMasterKey = await deriveMasterKey(password.value, newSalt, newServerSeed);

            const newEncryptedPrivateKey = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: newIv },
                newMasterKey,
                exportedPrivateKey
            );

            const newEncryptedPrivateKeyB64 = arrayToBase64(new Uint8Array(newEncryptedPrivateKey));
            const newSaltB64 = arrayToBase64(newSalt);
            const newIvB64 = arrayToBase64(newIv);

            const encryptedBundle = {
                publicKey: res.data.security.publicKey,
                encryptedPrivateKey: newEncryptedPrivateKeyB64,
                salt: newSaltB64,
                iv: newIvB64,
                serverSeed: res.data.security.newServerSeed,
            };
            
            await new Promise<void>((resolve, reject) => {
                const request = window.indexedDB.open("SecureMessengerDB", 1);
                request.onsuccess = (e: any) => {
                    const db = e.target.result;
                    const tx = db.transaction("secure_store", "readwrite");
                    tx.objectStore("secure_store").put(encryptedBundle, "encrypted_bundle");
                    tx.oncomplete = () => {
                        resolve();
                    };
                    tx.onerror = () => reject(tx.error);
                };
                request.onerror = () => reject(request.error);
            });

            await userApi.updatePrivateKey({
                publicKey: res.data.security.publicKey,
                encryptedPrivateKey: newEncryptedPrivateKeyB64,
                encryptionSalt: newSaltB64,
                encryptionIv: newIvB64,
            });

            secretStore.setKeys(decryptedPrivateKey, res.data.security.publicKey);

        } catch (cryptoError) {
            const errorMsg = cryptoError instanceof Error ? cryptoError.message : String(cryptoError);
            alert("보안 키를 해독하는 데 실패했습니다. 비밀번호를 다시 확인해주세요.\n상세: " + errorMsg);
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