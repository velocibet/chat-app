<script setup lang="ts">
import FriendList from '~/components/FriendList.vue';
import FriendRequests from '~/components/FriendRequests.vue';

const { socket, connect } = useSocket();
const friendsApi = useFriendsApi();
const chatSocket = useChatSocket();

const friendListRef = ref<InstanceType<typeof FriendList> | null>(null);
const friendRequestsRef = ref<InstanceType<typeof FriendRequests> | null>(null);

const blockPopup = ref(false);
const blockPopupRef = ref<HTMLElement | null>(null);
const selectedUserId = ref<number | null>(null);
const friendName = ref<string>("");
const activeTab = ref<'friends' | 'requests'>('friends');

definePageMeta({
  layout: "chat",
  middleware: ["auth"],
});

async function addFriend() {
  const res = await friendsApi.requestFriend({
    receiverUsername: friendName.value
  });

  if (res.success) {
    await friendRequestsRef.value?.refreshRequests();
    await friendListRef.value?.refreshFriends();
  }

  alert(res.message);
}

async function refresh(res: socketResponse) {
  await friendRequestsRef.value?.refreshRequests();
  await friendListRef.value?.refreshFriends();
}

function openBlockList() {
  blockPopup.value = true;
}

function handleClickOutside(event: MouseEvent) {
  if (!blockPopupRef.value) return;

  if (!(blockPopupRef.value.contains(event.target as Node))) {
    blockPopup.value = false;
  }
}

onMounted(async () => {
  await connect();
  chatSocket.onFriendRequest(refresh);

  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(async () => {
  await chatSocket.offFriendRequest(refresh);
  document.removeEventListener('click', handleClickOutside);
});

</script>

<template>
  <section class="request-container">
    <h3 class="title-text">친구 추가</h3>
    <form class="request-form" @submit.prevent="addFriend">
      <input
        class="primary-input"
        type="text"
        placeholder="아이디를 입력하세요."
        v-model="friendName"
      />
    </form>

    <nav class="title-nav">
      <h3 class="item" @click="activeTab = 'friends'">친구 목록</h3>
      <h3 class="item" @click="activeTab = 'requests'">친구 요청</h3>
      <h3 class="item" @click="openBlockList">차단 목록</h3>
    </nav>

    <div v-if="activeTab == 'friends'">
      <FriendList ref="friendListRef" @select="selectedUserId = $event" />
    </div>

    <div v-if="activeTab == 'requests'">
      <FriendRequests ref="friendRequestsRef" />
    </div>

    <Teleport to="body">
      <UserPopup
        v-if="selectedUserId"
        :userId="selectedUserId"
        @close="selectedUserId = null"
      />

      <BlockList
        v-if="blockPopup"
        ref="blockPopupRef"
        @close="blockPopup = false"
      />
    </Teleport>
  </section>
</template>
