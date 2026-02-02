export default defineNuxtRouteMiddleware(async (to, from) => {
  const userApi = useUserApi();
  const friendsApi = useFriendsApi();
  const authStore = useAuthStore();
  const frinedsStore = useFriendsStore();

  // 이미 사용자 데이터가 있으면 스킵
  if (authStore.user && authStore.user.userId) {
    return;
  }

  const userData = await userApi.getMe();
  if (userData.success && userData.data) {
    authStore.setUser(userData.data);
  } else {
    authStore.setUser(null);
    navigateTo("/");
    return;
  }

  const friendsData = await friendsApi.getFriends();

  if (friendsData.success && friendsData.data) {
    frinedsStore.setFriends(friendsData.data);
  } else {
    frinedsStore.setFriends([]);
    return;
  }
});
