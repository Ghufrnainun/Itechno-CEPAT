import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

interface SendPushParams {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}

/**
 * Inisialisasi Firebase Admin SDK (Server-Side Only)
 */
function getFirebaseAdmin(): App {
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]!
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey)
      return initializeApp({
        credential: cert(serviceAccount),
      })
    } catch (parseError) {
      console.warn('[Firebase Admin] Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format:', parseError)
    }
  }

  // Fallback initialization
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'itechno-cepat-mock',
  })
}

/**
 * Mengirim Push Notification ke FCM token target
 */
export async function sendPushNotification({ token, title, body, data }: SendPushParams): Promise<boolean> {
  if (!token) return false

  try {
    const adminApp = getFirebaseAdmin()
    const messaging = getMessaging(adminApp)

    await messaging.send({
      token,
      notification: {
        title,
        body,
      },
      data,
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
        },
        fcmOptions: {
          link: '/notifications',
        },
      },
    })

    return true
  } catch (error) {
    console.error('[sendPushNotification] FCM Send error:', error)
    return false
  }
}
