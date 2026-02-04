import { UseInterceptors, UploadedFile, Controller, Get, Post, Body, Req, Res, Param, ValidationPipe , BadRequestException, InternalServerErrorException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatroomDto } from './dto/chatroom.dto';
import type { Request, Response } from 'express';
import { ChatroomService } from './chatroom.service';
import { User } from 'src/decorators/user.decorator';
import { Readable } from 'stream';
import { DeleteObjectCommandOutput, DeleteObjectCommand, GetObjectCommandOutput, PutObjectCommand, GetObjectCommand, NotFound } from "@aws-sdk/client-s3";
import { s3 } from '../bucket';
import sharp from 'sharp';

@Controller('chatroom')
export class ChatroomController {
    constructor(private readonly ChatroomService: ChatroomService) {}

    @Post("room")
    async create(
        @User('userId') userId: number,
        @Body() body: ChatroomDto
    ) {
        const { type, member, membersArray, title } = body;
        return await this.ChatroomService.create(type, userId, member, membersArray, title);
    }

    @Get("rooms")
    async findAll(
        @User('userId') userId: number
    ) {
        return await this.ChatroomService.findAll(userId);
    }

    @Get("room/:id")
    async findOne(
        @Param('id') roomId: string,
        @User('userId') userId: number
    ) {
        return await this.ChatroomService.findOne(+roomId, userId);
    }

    @Post('room/image')
    @UseInterceptors(FileInterceptor('file'))
    async send(
        @User('userId') userId: number,
        @Req() req: Request,
        @UploadedFile() file: Express.Multer.File,
        @Body() body
    ) {
        const { roomId, title } = body;

        if (!file) throw new BadRequestException('파일 선택 후 전송하세요.');
        if (!file.mimetype.startsWith('image/')) throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
        
        if (file.size > 2 * 1024 * 1024) throw new BadRequestException('2MB 이하 파일만 업로드 가능합니다.');

        const fileName = `title:${roomId}-${Date.now()}.webp`;

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

            const message = await this.ChatroomService.saveImageUrl(userId, roomId, fileName, title);
            
            return {
                message: "성공적으로 파일을 저장했습니다.",
                data: message
            }
        } catch(error) {
            throw new InternalServerErrorException("이미지 처리 중 오류가 발생했습니다.", {cause: error});
        }
    }

    @Get("room/image/:filename")
    async getRoomImage(
        @Param('filename') filename: string,
        @User('userId') userId: number,
        @Res() res: Response
    ) {
        const check = await this.ChatroomService.checkImageUser(filename, userId);
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
}
