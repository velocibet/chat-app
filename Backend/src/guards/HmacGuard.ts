import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class HmacGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    const clientSignature = request.headers['x-hmac-signature'];
    const timestamp = request.headers['x-hmac-timestamp'];
    const secret = this.configService.get<string>('HMAC_SECRET', 'DefaultHmacSecret');

    if (!clientSignature || !timestamp) {
      throw new UnauthorizedException('HMAC signature or timestamp is missing');
    }

    const now = Date.now();
    if (Math.abs(now - parseInt(timestamp)) > 5 * 60 * 1000) {
      throw new UnauthorizedException('Request expired');
    }
    
    const body = JSON.stringify(request.body || {});
    const serverSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}:${body}`)
      .digest('hex');

    if (clientSignature !== serverSignature) {
      throw new UnauthorizedException('Invalid HMAC signature');
    }

    return true;
  }
}