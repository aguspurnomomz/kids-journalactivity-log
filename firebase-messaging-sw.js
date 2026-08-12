// Import Firebase scripts untuk Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Inisialisasi Firebase di background service worker
firebase.initializeApp({
  apiKey: "MASUKKAN_API_KEY_ANDA",
  authDomain: "MASUKKAN_AUTH_DOMAIN_ANDA",
  projectId: "MASUKKAN_PROJECT_ID_ANDA",
  storageBucket: "MASUKKAN_STORAGE_BUCKET_ANDA",
  messagingSenderId: "MASUKKAN_MESSAGING_SENDER_ID_ANDA",
  appId: "MASUKKAN_APP_ID_ANDA"
});

const messaging = firebase.messaging();

// Menangani background push notification
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Menerima pesan background: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});