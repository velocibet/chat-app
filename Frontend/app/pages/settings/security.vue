<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';
import { useUserApi } from '~/composables/api/useUserApi';

const authStore = useAuthStore();
const router = useRouter();
const userApi = useUserApi();

definePageMeta({
  layout: "setting",
  middleware: ["auth"],
});

const passwordPopup = ref(false);
const deletePopup = ref(false);
const currentPassword = ref<string>('');
const changePassword = ref<string>('');

function getPopup(){
  passwordPopup.value = !passwordPopup.value
}

function getDelete(){
  deletePopup.value = !deletePopup.value
}

async function submit() {
  const result = await userApi.changePassword({
      currentPassword: currentPassword.value,
      changePassword: changePassword.value
  });

  if (result?.success) {
    passwordPopup.value = false;
    currentPassword.value = '';
    changePassword.value = '';
  }

  alert(result.message);
}

async function submit2() {
  if (!confirm("계정을 정말 삭제하시겠습니까? 삭제시 즉각 모든 정보가 삭제되며, 복구할수 없으니 신중히 선택하시기 바랍니다.")) return;

  const result = await userApi.deleteAccount({
      currentPassword: currentPassword.value
  });

  if (result?.success) {
    router.push('/');
  }

  alert(result.message);
}

</script>

<template>
<div class="setting-page">
  <h1>보안 설정</h1>
  <button @click="getPopup" class="primary-button">비밀번호 변경</button>
  <div v-show="passwordPopup" class="modal-backdrop">
    <div class="modal">
      <button class="modal-close" @click="passwordPopup = false">✕</button>
      <h3>비밀번호 변경하기</h3>
      <form @submit.prevent="submit" class="input-form">
        <div class="password-input">
          <input v-model="currentPassword" type="password" placeholder="현재 비밀번호" class="primary-input" />
          <input v-model="changePassword" type="password" placeholder="변경할 비밀번호" class="primary-input" />
        </div>
                
        <button type="submit" class="outline-button">
          변경
        </button>
      </form>
    </div>
  </div>

  <button @click="getDelete" class="primary-button">계정 삭제</button>
  <div v-show="deletePopup" class="modal-backdrop">
    <div class="modal">
      <button class="modal-close" @click="deletePopup = false">✕</button>
      <h3>계정 삭제하기</h3>
      <form @submit.prevent="submit2" class="input-form">
        <div class="password-input">
          <input v-model="currentPassword" type="password" placeholder="현재 비밀번호" class="primary-input" />
        </div>
                
        <button type="submit" class="outline-button">
          삭제
        </button>
      </form>
    </div>
  </div>
</div>
</template>