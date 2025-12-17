import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      userid: string;
      username: string;
      nickname: string;
    };
    admin?: {
      userid: string;
      username: string;
      nickname: string;
    };
  }
}
