import { useApi } from "../useApi";

export const useChatroomApi = () => {
  const api = useApi("/chatroom");

  return {
    createRoom: (body: ChatroomCreateDto) =>
      api.post<number>("/room", body),

    getRooms: () => api.get<ChatroomListItem[]>("/rooms"),

    getRoom: (roomId: number | string) =>
      api.get<ChatroomListItem>(`/room/${roomId}`),
  };
};
