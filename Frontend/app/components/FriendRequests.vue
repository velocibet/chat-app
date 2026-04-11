<script lang="ts" setup>
const friendsApi = useFriendsApi();
const profileImage = useProfileImage();

const { data: requestsData, refresh: refreshRequests } = await useAsyncData<ApiResponse<Friend[]>>('requests', () => friendsApi.getRequests());
const requests = computed<Friend[]>(() => requestsData.value?.data ?? []);

async function acceptRequests(fi: string) {
  const res: ApiResponse = await friendsApi.handleRequest(fi, { status: "accepted" });

  if (res.success) { 
    await refreshRequests();
  }

  alert(res.message);
}

async function rejectRequests(fi: string) {
  const res: ApiResponse = await friendsApi.handleRequest(fi, { status: "rejected" });

  if (res.success) {
    await refreshRequests();
  }

  alert(res.message);
}

defineExpose({ refreshRequests });
</script>

<template>
    <div v-if="requests.length === 0">
        친구 요청이 존재하지 않습니다.
    </div>
    <div v-else
    class="request-item"
    v-for="(item, index) in requests"
    :key="index"
    >
        <div>
            <h5>{{ item.nickname }}</h5>
            <span>{{ item.username }}</span>
        </div>
        <div>
            <button
            class="outline-button"
            @click="acceptRequests(item.username)"
            >
            수락
            </button>
            <button
            class="primary-button"
            @click="rejectRequests(item.username)"
            >
            거절
            </button>
        </div>
    </div>
</template>