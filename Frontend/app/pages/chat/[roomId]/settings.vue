<script lang="ts" setup>
import '~/assets/css/chat-room.css';

definePageMeta({
  layout: "chat",
  middleware: ["auth"],
});

const router = useRouter();
const route = useRoute();

const chatroomApi = useChatroomApi();
const roomImage = useRoomImage();
const authStore = useAuthStore();

const roomId = route.params.roomId as string;
const { data: chatRoomData } = await useAsyncData<ApiResponse<ChatroomListItem>>('chatroom', () => chatroomApi.getRoom(+roomId));

const title = ref<string>(chatRoomData.value?.data.title ?? '그룹 채팅방');
const file = ref<File>();
const avatarUrl = ref<string>(roomImage.getUrl(chatRoomData.value?.data.room_image_url));

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
    const formData = new FormData();
    formData.append('roomId', roomId);
    formData.append('title', title.value);
    
    if (file.value) {
      formData.append('file', file.value);
    }

    const response = await chatroomApi.updateRoomSettings(formData);
    
    alert(response.message);
}
</script>

<template>
  <div class="settings-page">
    <div v-if="chatRoomData?.data.type === 'group'" class="settings-card">
      <div class="settings-header">
        <h1>그룹방 설정</h1>
        <p class="subtitle">채팅방의 이름과 프로필 사진을 관리하세요.</p>
      </div>

      <form class="room-form" @submit.prevent="submit">
        <div class="avatar-section">
          <label for="avatarInput" class="avatar-picker">
            <div class="avatar-container">
              <img :src="avatarUrl" class="profile-preview" />
              <div class="avatar-overlay">
                <span class="icon">📷</span>
                <span>변경</span>
              </div>
            </div>
          </label>
          <input 
            type="file" 
            id="avatarInput" 
            accept="image/*" 
            hidden 
            @change="handleFileChange" 
          />
          <p class="help-text">2MB 이하의 이미지 파일만 가능합니다.</p>
        </div>

        <div class="input-section">
          <label class="input-label">그룹방 이름</label>
          <input 
            v-model="title" 
            type="text" 
            placeholder="그룹방 이름을 입력하세요" 
            class="settings-input" 
          />
        </div>

        <div class="action-section">
          <button type="submit" class="save-button">설정 저장하기</button>
        </div>
      </form>
    </div>

    <div v-else class="error-card">
      <div class="error-icon">⚠️</div>
      <h2>접근할 수 없는 경로입니다.</h2>
      <p>그룹 채팅방 설정만 변경할 수 있습니다.</p>
      <button @click="router.back()" class="back-button">뒤로 가기</button>
    </div>
  </div>
</template>