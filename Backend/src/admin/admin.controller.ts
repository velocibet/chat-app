import { UseInterceptors, UploadedFile, Controller, Get, Post, Body, Req, Res, Param, ValidationPipe , BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/admin.dto';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}
    @Post('login')
      async getLogin(@Body() body : LoginDto, @Req() req: Request) {
        
      const result = await this.adminService.login(body);

      // 세션 발급
      req.session.admin = {
        userid: result.userId,
        username: result.username,
        nickname: result.nickname
      }

      return result;
    }
}
