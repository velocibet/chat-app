<script setup lang="ts">
import '~/assets/css/chat-layout.css';
import { makeRoom } from '#imports';

const authStore = useAuthStore();
const selectedFriends = ref<string[]>([]);
const groupName = ref<string>('');

async function createRoom() {
    try {
        if (selectedFriends.value.length > 1) {
            await makeRoom({
                type: "group",
                membersArray: selectedFriends.value,
                title: groupName.value
            });
        } else if (selectedFriends.value.length === 0) {
            alert("최소 한명 이상 선택해야 합니다.")
        } else {
            await makeRoom({
                type: "dm",
                member: selectedFriends.value[0]
            });
        }
    } catch(err) {
        console.log("채팅방을 생성하는데에 실패했습니다: ", err);
    }
}

</script>

<template>

<div class="room-popup">
    <header>
        <h3>채팅방 만들기</h3>
    </header>
    <main>
        <form @submit.prevent="createRoom">
            <div v-for="friend in authStore.friends" class="list">
                <div class="title">
                    <p>{{ friend.nickname }}</p>
                    <span>{{ friend.username }}</span>
                </div>
                <input type="checkbox" :value="friend.userId" v-model="selectedFriends" />
            </div>
            <div v-if="selectedFriends.length > 1">
                <h4>그룹방 이름을 입력하세요.</h4>
                <input type="text" v-model="groupName" />
            </div>
            <button type="submit" class="outline-button">방 생성하기</button>
        </form>
    </main>
</div>

</template>