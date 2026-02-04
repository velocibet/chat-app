import { useApi } from "../useApi";

export const useChatroomApi = () => {
  const config = useRuntimeConfig();
  const api = useApi("/chatroom");

  return {
    createRoom: (body: ChatroomCreateDto) =>
      api.post<number>("/room", body),

    getRooms: () => api.get<ChatroomListItem[]>("/rooms"),

    getRoom: (roomId: number | string) =>
      api.get<ChatroomListItem>(`/room/${roomId}`),
    
    /**
     * 방 이미지 URL 반환 (img 태그 src용)
     */
    getRoomImageUrl: (filename: string) => {
      if (!filename) return 'images/default-avatar.webp'; // 기본 이미지 대응
      return api.get<Blob>(`room/image/${filename}`, {
        responseType: 'blob'
      }) as Promise<ApiResponse<Blob>>;
    },

    /**
     * 방 설정 및 이미지 업로드
     */
    updateRoomSettings: (formData: FormData) => 
      api.post<ApiResponse<any>>("/room/image", formData),
  };
};
