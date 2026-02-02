import { defineStore } from 'pinia';
import type { User } from '~/types/users';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  /**
   * 사용자의 정보를 저장합니다.
   * @param userData 사용자의 정보 (userId, username, nickname)
   */
  function setUser(userData: User | null) {
    user.value = userData;
  }

  return { user, setUser };
})
