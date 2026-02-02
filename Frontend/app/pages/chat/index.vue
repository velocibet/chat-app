<script setup lang="ts">
import type { Friend } from "~/types/friends";
import type { ApiResponse } from "~/types/response";

const friendsApi = useFriendsApi();
const userApi = useUserApi();

const { data: friendsData, refresh: refreshFriends } = await useAsyncData<ApiResponse<Friend[]>>('friends', () => friendsApi.getFriends());
const { data: requestsData, refresh: refreshRequests } = await useAsyncData<ApiResponse<Friend[]>>('requests', () => friendsApi.getRequests());

const friends = computed<Friend[]>(() => friendsData.value?.data ?? []);
const requests = computed<Friend[]>(() => requestsData.value?.data ?? []);

const friendName = ref<string>("");
const popup = ref<boolean>(false);
const selectedUserId = ref<string | null>(null);

definePageMeta({
  layout: "chat",
  middleware: ["auth"],
});

async function acceptRequests(fi: string) {
  const res: ApiResponse = await friendsApi.handleRequest(fi, { status: "accepted" });

  if (res.success) {
    await refreshFriends(); 
    await refreshRequests();
  }

  alert(res.message);
}

async function rejectRequests(fi: string) {
  const res: ApiResponse = await friendsApi.handleRequest(fi, { status: "rejected" });

  if (res.success) {
    await refreshFriends(); 
    await refreshRequests();
  }

  alert(res.message);
}

async function addFriend() {
  const res = await friendsApi.requestFriend({
    receiverUsername: friendName.value
  });

  if (res.success) {
    await refreshFriends(); 
    await refreshRequests();
  }

  alert(res.message);
}

function getPopup() {
  popup.value = !popup.value;
}
</script>

<template>
  <section class="request-container">
    <h3>친구 추가</h3>
    <form @submit.prevent="addFriend">
      <input
        class="primary-input"
        type="text"
        placeholder="아이디를 입력하세요."
        v-model="friendName"
      />
      <button class="primary-button" type="submit">전송</button>
    </form>

    <h3>친구 요청</h3>
    <div>
      <div
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
    </div>

    <h3>친구 목록</h3>
    <div v-for="(item, index) in friends" :key="index">
      <p
        @click="selectedUserId = String(item.userId)"
        style="cursor: pointer"
      >
        {{ item.username }}
      </p>
    </div>
    <!-- <Teleport to="body">
      <UserPopup
        v-if="selectedUserId"
        :userId="selectedUserId"
        @close="selectedUserId = null"
      />
    </Teleport>

    <button class="outline-button" @click="getPopup">채팅방 만들기</button>
    <Teleport to="body">
      <RoomPopup v-if="popup" @close="popup = false" />
    </Teleport> -->
  </section>
</template>
