import * as admin from 'firebase-admin';
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import { pool } from '../database';

@Injectable()
export class FcmService implements OnModuleInit {
  onModuleInit() {
    if (admin.apps.length === 0) {
      const serviceAccountPath = path.join(process.cwd(), 'firebase-auth.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      console.log('✅ Firebase Admin SDK 초기화 완료');
    }
  }

  async sendPush(tokens: string[], title: string, body: string, data?: any) {
    if (tokens.length === 0) return;

    const message: admin.messaging.MulticastMessage = {
      notification: { title, body,
        imageUrl: `${process.env.FRONTEND_SITE}favicon.png`
       },
       webpush: {
        notification: {
            title,
            body,
            icon: `${process.env.FRONTEND_SITE}favicon.png`,
            tag: 'chat-notification',
            data: data || {},
        },
      },
      data: data || {},
      tokens: tokens
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`${response.successCount}개의 푸시 알림 발송 성공`);
    } catch (error) {
      console.error('FCM 발송 중 에러:', error);
    }
  }

    /**
     * 주어진 사용자 목록에 속한 모든 토큰을 가져옵니다.
     */
    async getPushTokens(userIds: number[]) {
        if (!userIds || userIds.length === 0) return [];
        const { rows } = await pool.query(
        `SELECT token FROM user_push_tokens WHERE "userId" = ANY($1::int[])`,
        [userIds]
        );
        const tokens = Array.from(new Set(rows.map(r => r.token)));
        return tokens;
    }
}