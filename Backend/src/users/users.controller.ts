import { UseInterceptors, UploadedFile, Controller, Get, Post, Body, Req, Res, Param, ValidationPipe , BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { RegisterDto, LoginDto, FriendRequestDto, UpdateDto, ChangePasswordDto, DeleteDto } from './dto/users.dto';
import type { Request, Response } from 'express';
// 이건 부자가 되서 쓰자.. 서버 CPU 가 좆구려서 안돌아간다..
// import sharp from 'sharp';
import fs from 'fs';
import * as path from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async getRegister(@Body() body : RegisterDto) {
    return await this.usersService.register(body);
  }

  @Post('login')
  async getLogin(@Body() body : LoginDto, @Req() req: Request) {
    const result = await this.usersService.login(body);

    // 세션 발급
    req.session.user = {
      userid: result.userId,
      username: result.username,
      nickname: result.nickname
    }

    return result
  }

  @Get('checkLogin')
  async checkLogin(@Req() req: Request) {
    if (!req.session.user) {
      return false;
    }

    const friendList = await this.usersService.checkFriend(req.session.user.userid);
    const user = await this.usersService.checkProfile(Number(req.session.user.userid));

    return {user, friendList};
  }

  @Post('friend-request')
  async sendFriendRequest(@Body() body: FriendRequestDto, @Req() req: Request) {
    if (!req.session.user) {
      throw new BadRequestException('로그인 상태가 아닙니다.');
    }

    const friend_request = {
      userId: req.session.user.userid,
      friendName: body.friendName
    }

    return await this.usersService.sendFriendRequest(friend_request);
  }

  @Get('logout')
  async getLogout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy((err) => {
      if (err) {
        throw new BadRequestException("세션 삭제 실패");
      }

      res.clearCookie('connect.sid');
      return res.json({ message: "로그아웃 되었습니다." });
    });
  }

  // @Post('update')
  // @UseInterceptors(FileInterceptor('file'))
  // async getUpdate(@UploadedFile() file: Express.Multer.File, @Body() body : UpdateDto) {
  //   const { userid, username, nickname } = body;
    
  //   if (!file) throw new BadRequestException('파일 선택 후 전송하세요.');
  //   if (!file.mimetype.startsWith('image/')) throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
  //   if (file.size > 2 * 1024 * 1024) throw new BadRequestException('2MB 이하 파일만 업로드 가능합니다.');

  //   this.usersService.updateProfile(userid, username, nickname);
    
  //   const webpBuffer = await sharp(file.buffer)
  //     .webp({ quality: 80 }) // 0 ~ 100
  //     .toBuffer();

  //   const uploadDir = path.join(process.cwd(), 'uploads/profiles');
  //   const savePath = path.join(uploadDir, `${userid}.webp`);

  //   if (fs.existsSync(savePath)) {
  //     fs.unlinkSync(savePath);
  //   }

  //   fs.writeFileSync(savePath, webpBuffer);
    
  //   return { ok: true };
  // }

  @Post('update')
  @UseInterceptors(FileInterceptor('file'))
  async getUpdate(@UploadedFile() file: Express.Multer.File, @Body() body: UpdateDto) {
    const { userid, username, nickname } = body;

    if (!file) throw new BadRequestException('파일 선택 후 전송하세요.');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
    if (file.size > 2 * 1024 * 1024) throw new BadRequestException('2MB 이하 파일만 업로드 가능합니다.');

    this.usersService.updateProfile(userid, username, nickname);

    const uploadDir = path.join(process.cwd(), 'uploads/profiles');
    const savePath = path.join(uploadDir, `${userid}.webp`); // 파일명만 webp로 변경

    if (fs.existsSync(savePath)) {
      fs.unlinkSync(savePath);
    }

    fs.writeFileSync(savePath, file.buffer); // 실제 변환 없이 그대로 저장

    return { ok: true };
  }


  @Get('checkProfileImage')
  async checkProfileImage(@Req() req: Request) {
    if (!req.session.user) return

    const userid = req.session.user.userid;
    
    const uploadDir = path.join(process.cwd(), 'uploads/profiles');
    const savePath = path.join(uploadDir, `${userid}.webp`);

    let existingImage = false;

    if (fs.existsSync(savePath)) {
      existingImage = true;
    }

    return { existingImage: existingImage }
  }

  @Post('changePassword')
  async changePassword(@Body() body : ChangePasswordDto) {
    return await this.usersService.changePassword(body);
  }

  @Post('delete')
  async getDelete(@Body() body : DeleteDto, @Req() req: Request, @Res() res: Response) {
    const userid = body.userId;

    await new Promise<void>((resolve, reject) => {
      req.session.destroy(err => {
        if (err) reject(new BadRequestException("세션 삭제 실패"));
        else resolve();
      });
    });
    
    const uploadDir = path.join(process.cwd(), 'uploads/profiles');
    const savePath = path.join(uploadDir, `${userid}.webp`);

    if (fs.existsSync(savePath)) {
      fs.unlinkSync(savePath);
    }

    res.clearCookie('connect.sid');
    return res.json(await this.usersService.getDelete(body));
  }
}
