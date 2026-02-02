import { UseInterceptors, UploadedFile, Controller, Get, Post, Body, Req, Res, Param, ValidationPipe , BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ChatroomDto } from './dto/chatroom.dto';
import type { Request, Response } from 'express';
import { ChatroomService } from './chatroom.service';
import { User } from 'src/decorators/user.decorator';

@Controller('chatroom')
export class ChatroomController {
    constructor(private readonly ChatroomService: ChatroomService) {}

    @Post("room")
    async create(
        @User('userId') userId: number,
        @Body() body: ChatroomDto,
        @Req() req: Request
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
}
