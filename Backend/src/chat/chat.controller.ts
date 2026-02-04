import { 
  Controller, Get, Post, Patch, Delete, Body, Req, Res, Param,
  UseInterceptors, UploadedFile, 
  BadRequestException, InternalServerErrorException, UnauthorizedException, NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { Readable } from 'stream';
import { ChatService } from './chat.service';
import { ChatGateway } from './ChatGateway';
import { User } from 'src/decorators/user.decorator';
import { socketOk } from 'src/socket.response';
import { DeleteObjectCommandOutput, DeleteObjectCommand, GetObjectCommandOutput, PutObjectCommand, GetObjectCommand, NotFound } from "@aws-sdk/client-s3";
import { s3 } from '../bucket';
import sharp from 'sharp';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService, private gateway: ChatGateway) {}
  
    @Post('image')
    @UseInterceptors(FileInterceptor('file'))
    async send(
      @User('userId') userId: number,
      @Req() req: Request,
      @UploadedFile() file: Express.Multer.File,
      @Body() body
    ) {
      const { roomId } = body;

      if (!file) throw new BadRequestException('파일 선택 후 전송하세요.');
      if (!file.mimetype.startsWith('image/')) throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
      
      if (file.size > 2 * 1024 * 1024) throw new BadRequestException('2MB 이하 파일만 업로드 가능합니다.');

      const fileName = `${roomId}-${Date.now()}.webp`;

      try {
        const processedImage = await sharp(file.buffer)
          .resize(1200, 1200, { 
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 80 })
          .toBuffer();

        await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_CHATS,
            Key: fileName,
            Body: processedImage,
            ContentType: 'image/webp',
        }));

        const message = await this.chatService.saveImageUrl(userId, roomId, fileName);
        this.gateway.server.to(`room:${roomId}`).emit('newMessage', socketOk("메세지를 성공적으로 보냈습니다.", message));
        
        return {
          message: "성공적으로 파일을 전송했습니다.",
          data: message
        }
      } catch(error) {
        console.error(error);
        throw new InternalServerErrorException("이미지 처리 중 오류가 발생했습니다.", {cause: error});
      }
    }

    @Get('image/:filename')
    async getProfileImage(
      @Param('filename') filename: string,
      @User('userId') userId: number,
      @Res() res: Response
    ) {
      const check = await this.chatService.checkImageUser(filename, userId);
      if (!check) throw new UnauthorizedException("접근할 수 없습니다.");

      try {
        const { Body, ContentType, ContentLength } = await s3.send(
          new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_CHATS,
            Key: filename,
          })
        );

        res.set({
          'Content-Type': ContentType,
          'Content-Length': ContentLength,
          'Content-Disposition': 'inline',
          'Cache-Control': 'public, max-age=3600', // 1시간동안 브라우저 캐싱 허용
        });

        if (Body) {
          const stream = Body as unknown as Readable;
          stream.pipe(res);
        } else throw new NotFoundException('이미지를 찾을 수 없습니다.');
      } catch (error) {
        throw new NotFoundException('이미지를 찾을 수 없습니다.', {cause: error});
      }
    }
  
    @Delete('image')
    async deleteImage(
      @User('userId') userId: number,
      @Body() body
    ) {
      const { messageId, fromId, toId } = body;
      if (userId != fromId && userId != toId) throw new UnauthorizedException("파일을 열람할 권한이 없습니다.");
  
      const fileName = await this.chatService.getImageUrl(messageId);
      if (!fileName) throw new InternalServerErrorException("파일이 존재하지 않습니다.");
  
      try {
        const s3Object: DeleteObjectCommandOutput = await s3.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_CHATS,
          Key: fileName
        }));
  
        return
      } catch(error) {
        throw new InternalServerErrorException("알수 없는 이유로 파일 불러오기에 실패했습니다", {cause: error});
      }
    }
}
