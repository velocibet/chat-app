<script lang="ts" setup>
import '~/assets/css/chat-room.css';

definePageMeta({
  layout: "chat",
  middleware: ["auth"],
});

const route = useRoute();

const chatroomApi = useChatroomApi();
const roomImage = useRoomImage();

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
    <div v-if="chatRoomData?.data.type === 'group'">
        <h1>그룹방 설정</h1>
        <form class="room-form" @submit.prevent="submit">
            <div class="form-top">
                <label for="avatarInput" class="avatar-wrapper">
                    <img :src="avatarUrl" class="profile-image" />
                    <span class="avatar-overlay">변경</span>
                </label>
                <input v-model="title" type="text" placeholder="그룹방 이름" class="primary-input" />
            </div>
            <input type="file" id="avatarInput" name="file" accept="image/*" hidden @change="handleFileChange" />
            <button type="submit" class="outline-button">저장</button>
        </form>

        <p>사진을 클릭하여 프로필 사진을 변경할수 있습니다. 프로필 사진은 2MB 이하의 사진만 가능합니다.</p>
    </div>
    <div v-else>
      접근할수 없는 경로입니다.
    </div>
</template>