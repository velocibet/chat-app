import { defineStore } from 'pinia';

interface Friend {
  id : number;
  username: string;
  nickname: string;
}

export const useAuthStore = defineStore('auth', () => {
  const username = ref<string | null>(null);
  const nickname = ref<string | null>(null);
  const userid = ref<number | null>(null);
  const friends = ref<Friend[]>([]);

  function setUser(name: string, id: number, nick: string, friendList: Friend[]) {
    username.value = name;
    nickname.value = nick;
    userid.value = id;
    friends.value = friendList;
  }

  function clearUser() {
    username.value = null;
    nickname.value = null;
    userid.value = null;
    friends.value = [];
  }

  function setNick(nick : string) {
    nickname.value = nick
  }

  function addFriend(body : Friend) {
    friends.value.push(body);
  }

  return { username, userid, nickname, friends, setUser, clearUser, setNick, addFriend };
})
