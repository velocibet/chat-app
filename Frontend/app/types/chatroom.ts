export interface ChatroomCreateDto {
  type: 'dm' | 'group';
  member?: number;
  membersArray?: number[];
  title?: string;
}

export interface Room {
  id: number;
  type: 'dm' | 'group';
  title: string | null;
  owner_user_id: number | null;
  dm_hash: string | null;
  created_at: string;
}

export interface RoomUserRow {
  id: number;
  room_id: number;
  userId: number;
  username: string;
  nickname: string;
  profileUrlName: string;
  role: 'owner' | 'member';
  joined_at: string;
  left_at: string | null;
}

export interface ChatroomListItem extends Room {
  room_users: RoomUserRow[];
}
