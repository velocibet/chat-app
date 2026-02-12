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

  return { friends, setFriends };
})
