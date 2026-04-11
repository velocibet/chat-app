import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 세션 객체 또는 세션의 특정 값을 가져오는 데코레이터
 * @SessionData() session -> session 객체 전체 (req.session)
 * @SessionData('id') id -> session.id 값
 */
export const SessionData = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const session = request.session;
    return data ? session?.[data] : session;
  },
);