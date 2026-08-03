import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Inisialisasi Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

/**
 * Mengambil instance Firebase Messaging (hanya di browser / client-side)
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  try {
    return getMessaging(app)
  } catch (error) {
    console.warn('[Firebase Client] Messaging not supported or failed to init:', error)
    return null
  }
}

/**
 * Meminta izin notifikasi browser dan mengambil FCM token
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('[FCM] Browser does not support notifications.')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied.')
      return null
    }

    const messaging = getFirebaseMessaging()
    if (!messaging) return null

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    const token = await getToken(messaging, { vapidKey })

    return token || null
  } catch (error) {
    console.error('[FCM] Error requesting FCM token:', error)
    return null
  }
}

/**
 * Mendengarkan pesan FCM saat aplikasi dalam keadaan aktif (foreground)
 */
export function onFcmForegroundMessage(callback: (payload: unknown) => void) {
  const messaging = getFirebaseMessaging()
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    console.log('[FCM Foreground Message Received]:', payload)
    callback(payload)
  })
}
