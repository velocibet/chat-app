<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const config = useRuntimeConfig();
const router = useRouter();

definePageMeta({
  layout: 'setting'
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
  try {
      const data : any = await $fetch(`${config.public.apiBase}/api/users/changePassword`, {
          method: "POST",
          credentials: 'include',
          body: {
              userId : authStore.userid,
              currentPassword: currentPassword.value,
              changePassword: changePassword.value
          }
      });

      if (data?.ok) {
        alert("비밀번호가 성공적으로 변경되었습니다.");
      } else {
        alert("알수 없는 에러입니다.");
      }
      
  } catch(error : any) {
      alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
  }
}

async function submit2() {
  if (!confirm("계정을 정말 삭제하시겠습니까? 삭제시 즉각 모든 정보가 삭제되며, 복구할수 없으니 신중히 선택하시기 바랍니다.")) return;

  try {
      const data : any = await $fetch(`${config.public.apiBase}/api/users/delete`, {
          method: "POST",
          credentials: 'include',
          body: {
              userId : authStore.userid,
              currentPassword: currentPassword.value
          }
      });

      if (data?.ok) {
        alert("계정이 성공적으로 삭제되었습니다.");
        router.push('/');
      } else {
        alert("알수 없는 에러입니다.");
      }
      
  } catch(error : any) {
      alert(error?.data?.message || "오류가 발생했습니다. 다시 시도해주세요.");
  }
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