import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.session || !req.session.user) {
      throw new UnauthorizedException('로그인이 필요합니다. 로그인을 해주세요.');
    }

    next();
  }
}
