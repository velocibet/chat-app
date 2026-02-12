import { UseInterceptors, UploadedFile, Controller, Get, Post, Delete,  Body, Req, Res, Param, ParseIntPipe , NotFoundException, BadRequestException, InternalServerErrorException, UnauthorizedException, Patch } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { RegisterDto, LoginDto, UpdateDto, ChangePasswordDto, DeleteDto } from './dto/users.dto';
import type { Request, Response } from 'express';
import { User } from 'src/decorators/user.decorator';
import { SessionData } from 'src/decorators/session.decorator';
import sharp from 'sharp';
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from '../bucket';
import fs from 'fs';
import * as path from 'path';
// import { Readable } from 'stream';
import { Resend } from 'resend';
import { useEmailVerifyHtml } from './email.verify.html';

const resend = new Resend(process.env.RESEND_API_KEY);

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService
  ) {}

  @Post('email/send')
  async send(@Body() body) {
    const { email } = body;
    const token = await this.usersService.createToken(email);
    
    await resend.emails.send({
      from: 'Velocibet 벨로시벳 <no-reply@velocibet.com>',
      to: [email],
      subject: '이메일 인증을 완료해주세요',
      html: useEmailVerifyHtml(token),
    });

    return "ok"
  }

  @Post('email/verify')
  async vertify(@Body() body){
    const { token } = body;

    const checkMessage = await this.usersService.verifyToken(token);

    return checkMessage;
  }

  @Post('register')
  async register(@Body() body : RegisterDto) {
    return await this.usersService.register(body);
  }

  @Post('login')
  async login(@Body() body : LoginDto, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip;
    const agent = req.headers['user-agent']!;

    try {
      const result = await this.usersService.login(body);

      req.session.user = {
          userId: result.userId,
          username: result.username,
          nickname: result.nickname
      }

      this.usersService.insertLoginLog({ username: result.username, ip: ip ?? 'unknown', agent, success: 1 })
        .catch(e => console.error('로그인 로그 저장 실패:', e));

      return result;
    } catch(error) {
      this.usersService.insertLoginLog({ username: body.username, ip: ip ?? 'unknown', agent, success: 0 })
        .catch(e => console.error('로그인 로그 저장 실패:', e));

      throw error;
    }
  }

  @Get('me')
  async check(@User('userId') userId: number) {
    const result = await this.usersService.findOneById(userId);

    return result;
  }

  @Get('logout')
  async logout(@SessionData() session, @Res({ passthrough: true }) res: Response) {
    if (!session) {
      return { message: "이미 로그아웃 상태입니다." };
    }
    await new Promise<void>((resolve, reject) => {
      session.destroy((err) => {
        if (err) {
          reject(new BadRequestException("세션 삭제 실패"));
        } else {
          resolve();
        }
      });
    }).catch(err => { throw err; });

    res.clearCookie('connect.sid', { path: '/' });

    return "로그아웃 되었습니다.";
  }

  @Patch()
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @UploadedFile() file: Express.Multer.File, 
    @User('userId') userId: number, 
    @Body() body: UpdateDto
  ) {
    const { username, nickname, bio } = body;

    if (file) {
      if (!file.mimetype.startsWith('image/')) throw new BadRequestException('이미지만 가능합니다.');
    }

    try {
      if (file) {
        const timestamp = Date.now();
        const fileName = `${userId}_${timestamp}.webp`;

        const currentUser = await this.usersService.findOneById(userId);
        const oldFileName = currentUser.profileUrlName;

        const processedImage = await sharp(file.buffer)
          .resize(300, 300, { fit: 'cover' })
          .webp({ quality: 80 })
          .toBuffer();

        await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_PROFILES,
            Key: fileName,
            Body: processedImage,
            ContentType: 'image/webp',
        }));

        if (oldFileName) {
          try {
            await s3.send(new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_PROFILES,
              Key: oldFileName,
            }));
          } catch (err) {
            console.error("-----[기존 파일 삭제 실패]-----");
            console.error(err);
            console.error("----------------------------");
          }
        }

        const userData = await this.usersService.updateProfile(userId, username, nickname, bio, fileName);
        
        return {
          message: "프로필이 성공적으로 업데이트 되었습니다.",
          data: userData
        };
      }

      const userData = await this.usersService.updateProfile(userId, username, nickname, bio);

      return {
        message: "프로필이 성공적으로 업데이트 되었습니다.",
        data: userData
      };
    } catch (error) {
      throw new InternalServerErrorException('프로필 업데이트 중 오류가 발생했습니다.', {cause: error});
    }
  }

  @Patch('password')
  async change(@User('userId') userId: number, @Body() body : ChangePasswordDto) {
    return await this.usersService.changePassword(userId, body);
  }

  @Delete()
  async delete(
    @SessionData() session,
    @User('userId') userId: number,
    @Body() body : DeleteDto,
    @Req() req: Request,
    @Res({passthrough: true}) res: Response) {
    if (!session) {
      return "로그아웃 상태입니다.";
    }
    
    const uploadDir = path.join(process.cwd(), 'uploads/profiles');
    const savePath = path.join(uploadDir, `${userId}.webp`);
    
    const result = await this.usersService.remove(userId, body);
    
    await new Promise<void>((resolve, reject) => {
      session.destroy((err) => {
        if (err) {
          reject(new BadRequestException("세션 삭제 실패"));
        } else {
          resolve();
        }
      });
    }).catch(err => { throw err; });
    res.clearCookie('connect.sid');

    if (fs.existsSync(savePath)) {
      fs.unlinkSync(savePath);
    }

    return result;
  }

  @Get(':userId')
  async profile(@Param('userId', ParseIntPipe) userId: number) {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
    }
    
    return user;
  }

  // @Get('profile-image/:filename')
  // async getProfileImage(
  //   @Param('filename') filename: string,
  //   @User('userId') userId: number,
  //   @Res() res: Response
  // ) {
  //   try {
  //     const { Body, ContentType, ContentLength } = await s3.send(new GetObjectCommand({
  //       Bucket: process.env.R2_BUCKET_PROFILES,
  //       Key: filename,
  //     }));

  //     res.set({
  //       'Content-Type': ContentType || 'image/webp',
  //       'Content-Length': ContentLength,
  //       'Cache-Control': 'public, max-age=86400', // 24시간 캐싱
  //     });
      
  //     if (Body) {
  //       const stream = Body as unknown as Readable;
  //       stream.pipe(res);
        
  //       stream.on('error', (err) => {
  //         console.error('이미지 스트리밍 에러:', err);
  //         if (!res.headersSent) res.status(500).send('Stream error');
  //         stream.destroy();
  //       });
  //     } else {
  //       throw new NotFoundException('파일을 찾을 수 없습니다.');
  //     }
  //   } catch (error) {
  //     if (!res.headersSent) {
  //       res.status(404).send('Not Found');
  //     }
  //   }
  // }
}
