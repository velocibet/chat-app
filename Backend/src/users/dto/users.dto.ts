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

  /* 개인정보처리방침 동의 여부. 클라이언트에서 체크된 상태여야 합니다. */
  @IsBoolean({ message: '개인정보처리방침 동의 여부는 true/false 여야 합니다.' })
  @IsNotEmpty({ message: '개인정보처리방침에 동의해야 합니다.' })
  privacyAgreement: boolean;
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

export class PushTokenDto {
  @IsString({ message: '토큰값이 필요합니다.' })
  token: string;

  @IsOptional()
  @IsString({ message: '디바이스 타입은 문자열이어야 합니다.' })
  deviceType?: string;
}
