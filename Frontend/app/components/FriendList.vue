<script lang="ts" setup>
const friendsApi = useFriendsApi();
const profileImage = useProfileImage();

const { data: friendsData, refresh: refreshFriends } = await useAsyncData<ApiResponse<Friend[]>>('friends', () => friendsApi.getFriends());
const friends = computed<Friend[]>(() => friendsData.value?.data ?? []);

const emit = defineEmits<{
  (e: 'select', userId: number): void
}>();

defineExpose({
  refreshFriends
});
</script>

<template>
    <div v-if="friends.length === 0">
      친구가 존재하지 않습니다. 
    </div>
    <div v-else v-for="(item, index) in friends" :key="index" class="friend-item" @click="emit('select', item.userId)">
      <div class="user-avatar">
        <img :src="profileImage.getUrl(item.profileUrlName)" />
      </div>
      <div>
        <h5> {{ item.nickname }} </h5>
        <span> {{ item.username }} </span>
      </div>
    </div>
</template>