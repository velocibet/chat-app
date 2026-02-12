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

  const maxSize = 2 * 1024 * 1024
  if (selectedFiles[0].size > maxSize) {
    alert("2MB 이하 파일만 업로드 가능합니다.");
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
  <div class="setting-page">
    <h1>프로필 설정</h1>

    <form class="profile-form" @submit.prevent="submit">
        <div class="form-top">
          <label for="avatarInput" class="avatar-wrapper">
            <img :src="avatarUrl" class="profile-image" />
            <span class="avatar-overlay">변경</span>
          </label>
          <input v-model="nickname" type="text" placeholder="사용자 이름" class="primary-input" />
          <input v-model="bio" type="text" placeholder="자기소개" class="primary-input" />
        </div>
        
        <input type="file" id="avatarInput" name="file" accept="image/*" hidden @change="handleFileChange" />
        <button type="submit" class="outline-button">
          저장
        </button>
    </form>

    <p>사진을 클릭하여 프로필 사진을 변경할수 있습니다. 프로필 사진은 2MB 이하의 사진만 가능합니다.</p>
  </div>
</template>