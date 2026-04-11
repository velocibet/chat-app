importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCUdAgHU1IM79l1_ewo2rzU-baP27YkaAU",
  authDomain: "velocibet-20aee.firebaseapp.com",
  projectId: "velocibet-20aee",
  storageBucket: "velocibet-20aee.firebasestorage.app",
  messagingSenderId: "307822661902",
  appId: "1:307822661902:web:8b1e929c423e4e1f20475f"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 리스너
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const roomId = event.notification.data?.roomId;
  const targetUrl = roomId ? `/chat/${roomId}` : '/'; 

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(windowClients) {
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});