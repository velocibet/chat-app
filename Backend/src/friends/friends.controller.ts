import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FriendsService } from './friends.service';
import { FriendRequestDto, HandleFriendRequestDto } from './dto/friends.dto';
import { User } from 'src/decorators/user.decorator';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async findAllFriends(
    @User('userId') userId: number
  ) {
    return await this.friendsService.findAllFriends(userId);
  }

  @Get('requests')
  async findAll(
    @User('userId') userId: number
  ) {
    return await this.friendsService.findAll(userId);
  }

  @Post('request')
  async create(
    @User('username') username: string,
    @Body() body: FriendRequestDto
  ) {
    return await this.friendsService.create(username, body);
  }

  @Patch('request/:username')
  async update(
    @Param('username') receiverUsername: string,
    @User('username') username: string,
    @Body() body: HandleFriendRequestDto
  ){
    return await this.friendsService.update(username, receiverUsername, body);
  }

  @Delete('request/:username')
  async delete(
    @Param('username') receiverUsername: string,
    @User('username') username: string
  ){
    return await this.friendsService.remove(username, receiverUsername);
  }

  @Post('block/:username')
  async block(
    @Param('username') receiverUsername: string,
    @User('username') username: string
  ){
    return await this.friendsService.getBlock(username, receiverUsername);
  }
}
