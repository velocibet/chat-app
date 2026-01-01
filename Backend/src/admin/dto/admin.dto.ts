import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: '아이디를 입력하세요.' })
  username: string;

  @IsString({ message: '비밀번호를 입력하세요.' })
  password: string;
}