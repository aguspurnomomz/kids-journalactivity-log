importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');


firebase.initializeApp({
  apiKey: "AIzaSyDNyYNNaYg_-r9fta_IdemP6lPC1mMUd2E",
  authDomain: "jurnalsikecil-bc8c7.firebaseapp.com",
  projectId: "jurnalsikecil-bc8c7",
  storageBucket: "jurnalsikecil-bc8c7.firebasestorage.app",
  messagingSenderId: "1056020643691",
  appId: "1:1056020643691:web:a3968c458d3c4223d0d62e"
});

const messaging = firebase.messaging();


messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Menerima pesan background: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});