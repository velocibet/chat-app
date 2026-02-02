export interface JoinDirectRoom {
  roomId: number;
}

export interface SendMessage {
  senderId: number;
  roomId: number;
  content: string;
  isfile: number;
}

export interface PreviousMessage {
  fromId: number;
  toId: number;
}

export interface DeleteMessage {
  messageId: number;
  roomId: number;
  content: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  content: string;
  isfile: number;
  status: 'sent' | 'read' | 'deleted';
  created_at: string;
  updated_at?: string;
}

export interface ChatMessageResponse {
  success: boolean;
  message: string;
  data: ChatMessage[];
}

export interface SingleChatMessageResponse {
  success: boolean;
  message: string;
  data: ChatMessage;
}

export interface DeletedMessageResponse {
  success: boolean;
  message: string;
  data: ChatMessage;
}
