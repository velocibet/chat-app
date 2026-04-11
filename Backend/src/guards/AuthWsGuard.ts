import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { socketFail } from 'src/socket.response';

@Injectable()
export class AuthWsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();

    const user = client.request.session?.user;

    if (!user) {
      const result = socketFail('로그인 후 이용해주세요.');
      client.emit('error', result);
      client.disconnect(true);
      
      return false;
    }

    return true;
  }
}
