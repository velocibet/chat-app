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
  <div class="setting-page security-container">
    <div class="page-header">
      <h1>보안 설정</h1>
      <p class="description">계정의 안전을 위해 비밀번호를 관리하거나 계정을 삭제할 수 있습니다.</p>
    </div>

    <div class="security-sections">
      <div class="security-card">
        <div class="card-info">
          <h3>비밀번호 변경</h3>
          <p>주기적인 비밀번호 변경을 통해 계정을 안전하게 보호하세요.</p>
        </div>
        <button @click="getPopup" class="action-btn-outline">비밀번호 변경하기</button>
      </div>

      <div class="security-card danger">
        <div class="card-info">
          <h3>계정 삭제</h3>
          <p>계정 삭제 시 모든 데이터가 즉시 파기되며 복구할 수 없습니다.</p>
        </div>
        <button @click="getDelete" class="action-btn-danger">계정 탈퇴</button>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="passwordPopup" class="popup-overlay" @click.self="passwordPopup = false">
        <div class="user-popup security-modal">
          <div class="modal-header">
            <p class="name">비밀번호 변경</p>
            <button class="close-icon" @click="passwordPopup = false">✕</button>
          </div>
          <form @submit.prevent="submit" class="modal-body">
            <div class="input-group">
              <label class="input-label">현재 비밀번호</label>
              <input v-model="currentPassword" type="password" placeholder="기존 비밀번호 입력" class="primary-input" />
            </div>
            <div class="input-group">
              <label class="input-label">새 비밀번호</label>
              <input v-model="changePassword" type="password" placeholder="새 비밀번호 입력" class="primary-input" />
            </div>
            <div class="modal-footer">
              <button type="submit" class="confirm-btn">변경하기</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="deletePopup" class="popup-overlay" @click.self="deletePopup = false">
        <div class="user-popup security-modal">
          <div class="modal-header">
            <p class="name red">계정 삭제 확인</p>
            <button class="close-icon" @click="deletePopup = false">✕</button>
          </div>
          <form @submit.prevent="submit2" class="modal-body">
            <p class="warning-text">본인 확인을 위해 현재 비밀번호를 입력해주세요.</p>
            <div class="input-group">
              <input v-model="currentPassword" type="password" placeholder="현재 비밀번호 입력" class="primary-input" />
            </div>
            <div class="modal-footer">
              <button type="submit" class="danger-btn">영구 삭제하기</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>