<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';

definePageMeta({
  layout: "setting",
  middleware: ["auth"],
});

const auth = useAuthStore();
const router = useRouter();
const userApi = useUserApi();
const profileImage = useProfileImage();

const userId = ref<number | undefined>(auth.user?.userId);
const username = ref<string | undefined>(auth.user?.username);
const nickname = ref<string | undefined>(auth.user?.nickname);
const bio = ref<string | undefined>(auth.user?.bio);
const file = ref<File>();

const avatarUrl = ref<string>(profileImage.getUrl(auth.user?.profileUrlName));

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const selectedFiles = target.files;

  if (!selectedFiles || selectedFiles.length === 0) return;
  if (!selectedFiles[0]) return;
  
  if (selectedFiles.length > 1) {
    alert("파일은 한 개만 넣을 수 있습니다.");
    target.value = '';
    return;
  };

  if (!selectedFiles[0].type.startsWith("image/")) {
    alert("이미지 파일만 업로드 가능합니다.");
    target.value = '';
    return
  }

  const maxSize = 5 * 1024 * 1024
  if (selectedFiles[0].size > maxSize) {
    alert("5MB 이하 파일만 업로드 가능합니다.");
    target.value = '';
    return
  }
  
  file.value = selectedFiles[0];

  if (avatarUrl.value) {
    URL.revokeObjectURL(avatarUrl.value);
  }
  avatarUrl.value = URL.createObjectURL(file.value);
}

async function submit() {
  if (!username.value) {
    alert("로그인이 필요합니다.")
    return
  }

  if (!nickname.value || nickname.value.length < 1) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  const formData = new FormData();
  formData.append('username', username.value);
  formData.append('nickname', nickname.value);
  if (bio.value) formData.append('bio', bio.value);
  if (file.value) formData.append('file', file.value);

  const res: ApiResponse = await userApi.updateProfile(formData);
  
  if (res.success) {
    auth.setUser(res.data)
  }

  alert(res.message);
}

onMounted(() => {
  console.log(auth.user)
})

onUnmounted(() => {
  if (avatarUrl.value) {
    URL.revokeObjectURL(avatarUrl.value);
  }
});
</script>

<template>
  <div class="setting-page profile-edit-container">
    <div class="page-header">
      <h1>프로필 설정</h1>
      <p class="description">내 계정의 프로필 사진과 기본 정보를 관리하세요.</p>
    </div>

    <form class="profile-form" @submit.prevent="submit">
      <div class="avatar-section">
        <label for="avatarInput" class="avatar-wrapper-circle">
          <img :src="avatarUrl" class="profile-image" />
          <div class="avatar-overlay">
            <span class="icon">📷</span>
            <span>교체</span>
          </div>
        </label>
          <p class="avatar-tip">사진을 클릭하여 변경 (5MB 이하)</p>
        <input type="file" id="avatarInput" name="file" accept="image/*" hidden @change="handleFileChange" />
      </div>

      <div class="form-body">
        <div class="input-group">
          <label class="input-label">아이디</label>
          <input :value="username" type="text" class="primary-input disabled" style="cursor: not-allowed;" disabled />
          <span class="input-hint">아이디는 변경할 수 없습니다. 변경 필요시 관리자에게 문의하세요.</span>
        </div>

        <div class="input-group">
          <label class="input-label">닉네임</label>
          <input v-model="nickname" type="text" placeholder="사용할 닉네임을 입력하세요" class="primary-input" />
        </div>

        <div class="input-group">
          <label class="input-label">자기소개</label>
          <textarea v-model="bio" placeholder="나를 표현하는 짧은 소개를 입력하세요" class="primary-textarea"></textarea>
        </div>
      </div>

      <div class="form-footer">
        <button type="submit" class="save-btn">프로필 저장하기</button>
      </div>
    </form>
  </div>
</template>