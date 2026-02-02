import { useApi } from "../useApi";
import type { ApiResponse } from "~/types/response";

export const useChatApi = () => {
  const api = useApi('/chat');

  return {
    /** 채팅방 이미지 업로드 */
    sendImage: async (roomId: number, file: File) => {
      const formData = new FormData();
      formData.append('roomId', String(roomId));
      formData.append('file', file);

      // let the browser set Content-Type (including boundary)
      return api.post<any>('/image', formData) as Promise<ApiResponse<any>>;
    },

    /** 채팅 이미지 가져오기 */
    getImage: async (filename: string) => {
      return api.get<Blob>(`/image/${filename}`, {
        responseType: 'blob'
      }) as Promise<ApiResponse<Blob>>;
    },

    /** 채팅 이미지 삭제 */
    deleteImage: async (messageId: number, fromId: number, toId: number) => {
      return api.delete<any>('/image', {
        body: {
          messageId,
          fromId,
          toId
        }
      }) as Promise<ApiResponse<any>>;
    }
  };
};
