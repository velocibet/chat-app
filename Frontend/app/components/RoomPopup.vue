<script setup lang="ts">
import { on } from 'events';
import '~/assets/css/chat-layout.css';

const friendsStore = useFriendsStore();
const chatroomApi = useChatroomApi();
const selectedFriends = ref<number[]>([]);
const groupName = ref<string>('');

async function createRoom() {
    console.log(selectedFriends)
    if (selectedFriends.value.length > 1) {
        const response = await chatroomApi.createRoom({
            type: "group",
            membersArray: selectedFriends.value,
            title: groupName.value
        });
        alert(response.message);
    } else if (selectedFriends.value.length === 0) {
        alert("최소 한명 이상 선택해야 합니다.")
    } else {
        const response = await chatroomApi.createRoom({
            type: "dm",
            member: selectedFriends.value[0]
        });
        alert(response.message);
    }
}

onMounted(async () => {
    console.log(friendsStore.friends);
});
</script>

<<template>
  <div class="room-popup">
    <header>
      <h3>채팅방 만들기</h3>
    </header>
    <main>
      <form @submit.prevent="createRoom">
        <div v-for="friend in friendsStore.friends" :key="friend.userId" class="list">
          <div class="title">
            <p>{{ friend.nickname }}</p>
            <span>{{ friend.username }}</span>
          </div>
          <input type="checkbox" :value="friend.userId" v-model="selectedFriends" >
        </div>

        <div v-if="selectedFriends.length > 1">
          <h4>그룹방 이름을 입력하세요.</h4>
          <input type="text" v-model="groupName" placeholder="방 제목" />
        </div>
        
        <button type="submit" class="outline-button">방 생성하기</button>
      </form>
    </main>
  </div>
</template>