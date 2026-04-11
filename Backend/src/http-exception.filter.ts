import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * 전역 예외 필터
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = '서버 내부 오류가 발생했습니다.';
    
    if (exception instanceof HttpException) {
      const errRes = exception.getResponse() as any;
      message = errRes.message || exception.message;
    }

    if (status >= 500) {
        const cause = (exception as any)?.options?.cause || (exception as any)?.cause;

        console.error('--- [INTERNAL SERVER ERROR] ---');
        console.error(`Timestamp: ${new Date().toISOString()}`);
        console.error(`Status: ${status}`);

        if (exception instanceof Error) {
            console.error(`Message: ${exception.message}`);
        }

        if (cause) {
            console.error('[CAUSE DETECTED]');
            console.error(cause); 
        }
        
        console.error('------------------------------');
    } else {
        console.warn(`[WARN] ${status} - ${new Date().toISOString()} - ${ (exception as any).message }`);
    }

    response.status(status).json({
      success: false,
      message: message,
      data: {},
    });
  }
}