export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  changePassword: string;
}

export interface DeleteDto {
  currentPassword: string;
}

export interface User {
  userId: number;
  username: string;
  nickname: string;
  bio: string;
  profileUrlName?: string;
}

export interface LoginReponse {
  success: true;
  userId: number;
  username: string;
  nickname: string;
}