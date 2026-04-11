import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class EmailDto {
  @IsEmail()
  email: string;
}

export class RegisterDto {
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  @MinLength(6, { message: '사용자 이름은 최소 6자 이상이어야 합니다.' })
  username: string;
  
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;

  @IsBoolean({ message: '개인정보처리방침 동의 여부는 true 또는 false 여야 합니다.' })
  @IsNotEmpty({ message: '개인정보처리방침에 동의해야 합니다.' })
  privacyAgreement: boolean;

  @IsString({ message: '공개키 형식이 올바르지 않습니다.' })
  @IsNotEmpty({ message: '공개키는 필수 항목입니다.' })
  publicKey: string;

  @IsString({ message: '암호화된 개인키 형식이 올바르지 않습니다.' })
  @IsNotEmpty({ message: '개인키 보따리는 필수 항목입니다.' })
  encryptedPrivateKey: string;

  @IsString({ message: '암호화 Salt 형식이 올바르지 않습니다.' })
  @IsNotEmpty({ message: '보안 소금값은 필수 항목입니다.' })
  encryptionSalt: string;

  @IsString({ message: '암호화 IV 형식이 올바르지 않습니다.' })
  @IsNotEmpty({ message: '보안 IV값은 필수 항목입니다.' })
  encryptionIv: string;

  @IsString({ message: 'clientId는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: 'clientId는 필수 항목입니다.' })
  clientId: string;
}

export class LoginDto {
  @IsString({ message: '아이디를 입력하세요.' })
  username: string;

  @IsString({ message: '비밀번호를 입력하세요.' })
  password: string;
}

export class FriendRequestDto {
  @IsString({ message: '친구 ID를 입력하세요.' })
  friendName: string;
}

export class UpdateDto {
  @IsString({ message: "로그인 상태가 아닙니다. 로그인 후 시도하세요." })
  username: string;

  @IsString({ message: "닉네임을 입력하세요." })
  nickname: string;

  @IsOptional()
  @IsString({ message: "소개글은 문자열이어야 합니다." })
  bio?: string;
}

export class ChangePasswordDto {
  @IsString({ message: "비밀번호를 입력하세요." })
  currentPassword : string;
  
  @IsString({ message: "비밀번호를 입력하세요." })
  changePassword : string;
}

export class DeleteDto {
  @IsString({ message: "비밀번호를 입력하세요." })
  currentPassword : string;
}

export class UpdatePrivateKeyDto {
  @IsString({ message: '공개키 형식이 올바르지 않습니다.' })
  @IsNotEmpty({ message: '공개키는 필수 항목입니다.' })
  publicKey: string;

  @IsString({ message: '암호화된 개인키 형식이 올바르지 않습니다.' })
  @IsNotEmpty({ message: '개인키 보따리는 필수 항목입니다.' })
  encryptedPrivateKey: string;

  @IsString({ message: '암호화 Salt 형식이 올바르지 않습니다.' })
  @IsNotEmpty({ message: '보안 소금값은 필수 항목입니다.' })
  encryptionSalt: string;

  @IsString({ message: '암호화 IV 형식이 올바르지 않습니다.' })
  @IsNotEmpty({ message: '보안 IV값은 필수 항목입니다.' })
  encryptionIv: string;
}

export class PushTokenDto {
  @IsString({ message: '토큰값이 필요합니다.' })
  token: string;

  @IsOptional()
  @IsString({ message: '디바이스 타입은 문자열이어야 합니다.' })
  deviceType?: string;
}
