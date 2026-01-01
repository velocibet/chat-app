import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  @MinLength(6, { message: '사용자 이름은 최소 6자 이상이어야 합니다.' })
  username: string;
  
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;
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
  userid: string;

  @IsString({ message: "로그인 상태가 아닙니다. 로그인 후 시도하세요." })
  username: string;

  @IsString({ message: "닉네임을 입력하세요." })
  nickname: string;
}

export class ChangePasswordDto {
  @IsNumber()
  userId : number;

  @IsString({ message: "비밀번호를 입력하세요." })
  currentPassword : string;
  
  @IsString({ message: "비밀번호를 입력하세요." })
  changePassword : string;
}

export class DeleteDto {
  @IsNumber()
  userId : number;

  @IsString({ message: "비밀번호를 입력하세요." })
  currentPassword : string;
}
