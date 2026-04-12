export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  privacyAgreement: boolean;

  // --- E2EE 보안 관련 필드 ---
  publicKey: string;
  encryptedPrivateKey: string;
  encryptedServerSeed: string; 
  encryptionSalt: string;
  encryptionIv: string;
  seedEncryptionIv: string;
  clientId: string;
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
  isOnline?: boolean;
}

export interface LoginResponse {
  success: boolean;
  userId: number;
  username: string;
  nickname: string;

  // --- 보안 및 개인키 복구 관련 값 ---
  security: {
    publicKey: string;
    encryptedPrivateKey: string;
    encryptionSalt: string;
    encryptionIv: string;
    encryptedServerSeed: string;
    seedEncryptionIv: string;
    oldServerSeed: string | null;
    newServerSeed: string;
  };
}