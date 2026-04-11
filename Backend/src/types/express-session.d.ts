import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      userId: number;
      username: string;
      nickname: string;
    };
    admin?: {
      userId: number;
      username: string;
      nickname: string;
    };
  }
}

declare module 'http' {
  interface IncomingMessage {
    session?: Express.Session & {
      user?: {
        userId: number;
        username: string;
        nickname: string;
      };
      admin?: {
        userId: number;
        username: string;
        nickname: string;
      };
    };
  }
}
