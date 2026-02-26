import { defineStore } from 'pinia';

export const useFriendsStore = defineStore('friends', () => {
  const friends = ref<Friend[] | null>(null);

  /**
   * 사용자의 친구 목록을 저장합니다.
   * @param friendsData 친구 목록 정보 (userId, username, nickname)
   */
  function setFriends(friendsData: Friend[]) {
    friends.value = friendsData;
  }

  function updateFriendStatus(userId: number, isOnline: boolean) {
    if (!friends.value) return;
    const friend = friends.value.find(f => f.userId === userId);
    if (friend) {
      friend.isOnline = isOnline;
    }
  }

  return { friends, setFriends, updateFriendStatus };
})
