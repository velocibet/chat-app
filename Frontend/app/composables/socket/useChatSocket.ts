import type { JoinDirectRoom, SendMessage, DeleteMessage } from "~/types/chat";

export const useChatSocket = () => {
  const { socket } = useSocketStore();

  // 채팅방 join 상태
  const joinedRooms = ref<Set<string>>(new Set());

  /** Socket이 연결될 때까지 기다리기 */
  const waitForSocket = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 처음부터 socket이 없으면 재시도
      if (!socket) {
        let retries = 0;
        const maxRetries = 30;
        const checkInterval = setInterval(() => {
          const currentSocket = useSocketStore().socket;
          retries++;
          
          if (currentSocket && currentSocket.connected) {
            clearInterval(checkInterval);
            resolve();
          } else if (retries >= maxRetries) {
            clearInterval(checkInterval);
            reject(new Error('Socket initialization timeout'));
          }
        }, 100);
        return;
      }

      if (socket.connected) {
        resolve();
        return;
      }

      // socket이 연결될 때까지 대기
      let attempts = 0;
      const maxAttempts = 50; // 5초 (100ms * 50)
      const interval = setInterval(() => {
        attempts++;
        if (socket.connected) {
          clearInterval(interval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Socket connection timeout'));
        }
      }, 100);
    });
  };

  /** 채팅방 입장 */
  const joinRoom = (roomId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Socket store에서 직접 가져오기
      const socketStore = useSocketStore();
      const currentSocket = socketStore.socket;

      if (!currentSocket) {
        reject(new Error('Socket is not connected'));
        return;
      }
      
      if (!currentSocket.connected) {
        // Socket이 아직 연결되지 않았으면 대기
        let attempts = 0;
        const maxAttempts = 50; // 5초
        const interval = setInterval(() => {
          attempts++;
          if (currentSocket.connected) {
            clearInterval(interval);
            attemptJoin();
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error('Socket not connected'));
          }
        }, 100);
        return;
      }

      attemptJoin();

      function attemptJoin() {
        if (!currentSocket) return;
        
        if (joinedRooms.value.has(String(roomId))) {
          resolve();
          return;
        }

        currentSocket.emit('joinDirectRoom', { roomId } as JoinDirectRoom);
        
        // joinDirectRoom 응답 대기 (한 번만 수신)
        currentSocket.once('joinDirectRoom', (response: socketResponse) => {
          if (response.success) {
            joinedRooms.value.add(String(roomId));
            resolve();
          } else {
            reject(new Error(response.message));
          }
        });

        // 타임아웃 설정 (5초)
        setTimeout(() => {
          if (!joinedRooms.value.has(String(roomId))) {
            reject(new Error(`Join room timeout: ${roomId}`));
          }
        }, 5000);
      }
    });
  };

  /** 메시지 전송 */
  const sendMessageToRoom = (roomId: number, content: string, isfile = 0) => {
    if (!socket) return;

    socket.emit(
      'sendMessage',
      { roomId, content, senderId: 0, isfile } as SendMessage
    );
  };

  /** 메시지 삭제 */
  const deleteMessageInRoom = (roomId: number, messageId: number, content: string) => {
    if (!socket) return;

    socket.emit(
      'deleteMessage',
      { roomId, messageId, content } as DeleteMessage
    );
  };

  /** 이전 메시지 불러오기 */
  const loadMessages = (roomId: number, limit: number, lastId?: number) => {
    if (!socket) return;

    socket.emit('loadMessages', { roomId, limit, lastId });
  };

  /** 이벤트 리스너 등록 */
  const onNewMessage = (callback: (res: socketResponse) => void) => {
    socket?.on('newMessage', callback);
  };

  const onDeletedMessage = (callback: (res: socketResponse) => void) => {
    socket?.on('deletedMessage', callback);
  };

  const onJoinedRoom = (callback: (roomId: number) => void) => {
    socket?.on('joinedRoom', callback);
  };

  const onLoadMessages = (callback: (res: socketResponse) => void) => {
    socket?.on('loadMessages', callback);
  };

  /** 특정 방 나가기 */
  const leaveRoom = (roomId: number) => {
    if (!socket) return;

    socket.emit('leaveRoom', { roomId });
    joinedRooms.value.delete(String(roomId));
  };

  return {
    socket,
    joinRoom,
    sendMessageToRoom,
    deleteMessageInRoom,
    loadMessages,
    leaveRoom,
    onNewMessage,
    onDeletedMessage,
    onJoinedRoom,
    onLoadMessages,
    joinedRooms,
    waitForSocket,
  };
};
