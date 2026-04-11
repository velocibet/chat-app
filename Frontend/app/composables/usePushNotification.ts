import { getToken } from "firebase/messaging";
import { useUserApi } from "./api/useUserApi";

export const usePushNotification = () => {
  const { $fcm } = useNuxtApp();
  const config = useRuntimeConfig();

  const requestAndSaveToken = async () => {
    if (!process.client) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("푸시 알림 권한이 거부되었습니다.");
        return;
      }

      if ($fcm) {
        const token = await getToken($fcm as any, {
          vapidKey: config.public.vapidKey as string,
        });

        if (token) {
          console.log("획득한 FCM 토큰:", token);
          
          // 3. 서버에 저장
          const { sendPushToken } = useUserApi();
          try {
            await sendPushToken(token, 'web');
          } catch (e) {
            console.error('푸시 토큰 등록 중 오류', e);
          }
        }
      }
    } catch (error) {
      console.error("토큰 획득 중 오류:", error);
    }
  };

  return { requestAndSaveToken };
};