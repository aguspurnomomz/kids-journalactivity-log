import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Masukkan konfigurasi Firebase yang sudah Anda salin sebelumnya dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDNyYNNaYg_-r9fta_IdemP6lPC1mMUd2E",
  authDomain: "jurnalsikecil-bc8c7.firebaseapp.com",
  projectId: "jurnalsikecil-bc8c7",
  storageBucket: "jurnalsikecil-bc8c7.firebasestorage.app",
  messagingSenderId: "1056020643691",
  appId: "1:1056020643691:web:a3968c458d3c4223d0d62e"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Fungsi untuk meminta izin dan mendapatkan FCM Token
export const requestNotificationPermission = async (userId: string, supabaseClient: any) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Dapatkan token FCM menggunakan VAPID Key Anda (Diperbaiki: menggunakan 'const currentToken')
      const currentToken = await getToken(messaging, {
        vapidKey: 'BLVTMYjN5XGAlRYBjf_MwjpD-cd7W04FmkwlyQN7KJ4rl6H345UMwcynN1HJ7DBYcB3FNq10qBU9I1A4KdUxdZg'
      });

      if (currentToken) {
        // Simpan atau perbarui token ke tabel Supabase
        const { error } = await supabaseClient
          .from('user_fcm_tokens')
          .upsert(
            { 
              user_id: userId, 
              fcm_token: currentToken, 
              device_type: 'web',
              updated_at: new Date().toISOString()
            },
            { onConflict: 'fcm_token' }
          );

        if (error) {
          console.error('Gagal menyimpan FCM token ke Supabase:', error.message);
        } else {
          console.log('FCM Token berhasil disimpan:', currentToken);
        }
      } else {
        console.warn('Tidak dapat menghasilkan token registrasi.');
      }
    } else {
      console.log('Izin notifikasi ditolak oleh pengguna.');
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat meminta izin notifikasi:', error);
  }
};

// Listener untuk pesan masuk saat aplikasi sedang dibuka (foreground)
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });