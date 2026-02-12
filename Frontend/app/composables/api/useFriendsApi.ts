import { useApi } from "../useApi";
import { type FriendRequestDto, type HandleFriendRequestDto, type Friend, type Block } from "~/types/friends";

export const useFriendsApi = () => {
  const api = useApi('/friends');

  return {
    /** [GET] 친구 목록(수락된 상태) 조회 */
    getFriends: () => api.get<Friend[]>(''),

    /** [GET] 친구 요청 목록 조회 */
    getRequests: () => api.get<Friend[]>('/requests'),

    /** [POST] 친구 요청 보내기 */
    requestFriend: (body: FriendRequestDto) => api.post<string>('/request', body),

    /** [PATCH] 친구 요청 수락/거절 처리 */
    handleRequest: (receiverUsername: string, body: HandleFriendRequestDto) => 
      api.patch<string>(`/request/${receiverUsername}`, body),

    /** [DELETE] 친구 삭제 또는 요청 취소 */
    removeFriend: (receiverUsername: string) => 
      api.delete<string>(`/request/${receiverUsername}`),

    /** [POST] 상대방 차단 */
    blockUser: (receiverUsername: string) => 
      api.post<string>(`/block/${receiverUsername}`),

    /** [DELETE] 상대방 차단 해제 */
    unblockUser: (receiverUsername: string) => 
      api.delete<string>(`/block/${receiverUsername}`),

    /** [GET] 차단한 유저 목록 불러오기 */
    getBlockedUsers: () => 
      api.get<Block[]>(`/blocks`),
  };
};