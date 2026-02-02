import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result) => {
        // 단순 문자열인 경우 (메시지만 보냄)
        if (typeof result === 'string') {
            return { success: true, message: result, data: {} };
        }

        // 객체 안에 message와 data가 이미 분리되어 있는 경우
        if (result?.message && result?.data) {
            return {
            success: true,
            message: result.message,
            data: result.data,
            };
        }

        // 일반적인 데이터 객체인 경우 (기본 메시지 OK 사용)
        return {
            success: true,
            message: 'OK',
            data: result || {},
        };
        }),
    );
  }
}