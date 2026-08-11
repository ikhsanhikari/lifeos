import webpush from 'web-push';
import { prisma } from '../server';

let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@lifeos.internal';

// Auto-generate VAPID keypair if missing in environment variables
if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn('⚠️ Warning: VAPID keys not found in environment. Generating temporary keypair...');
  const keys = webpush.generateVAPIDKeys();
  vapidPublicKey = keys.publicKey;
  vapidPrivateKey = keys.privateKey;
  console.log(`🔑 Generated VAPID Public Key:  ${vapidPublicKey}`);
  console.log(`🔑 Generated VAPID Private Key: ${vapidPrivateKey}`);
}

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err: any) {
  console.error('❌ Failed to set VAPID details for web-push:', err.message);
}

/**
 * Returns the public VAPID key for frontend browser subscription
 */
export function getVapidPublicKey(): string {
  return vapidPublicKey || '';
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Upsert a browser push subscription for a user
 */
export async function savePushSubscription(
  userId: string,
  sub: PushSubscriptionInput,
  userAgent?: string
) {
  return await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent || null,
    },
    update: {
      userId,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent || null,
    },
  });
}

/**
 * Delete a browser push subscription by endpoint
 */
export async function removePushSubscription(endpoint: string) {
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint },
    });
  } catch (e) {
    // Ignore if already deleted
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

/**
 * Send Web Push Notification to all registered browser devices for a user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  let successCount = 0;
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log(`[PUSH] No active push subscriptions found for user ${userId}. Skipping Web Push.`);
      return 0;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard',
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      tag: payload.tag || `lifeos-reminder-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: Date.now(),
    });

    for (const subRecord of subscriptions) {
      const pushSubscription = {
        endpoint: subRecord.endpoint,
        keys: {
          p256dh: subRecord.p256dh,
          auth: subRecord.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        successCount++;
      } catch (err: any) {
        // HTTP 410 (Gone), 404 (Not Found), 403 (Forbidden), or 401 (Unauthorized) means key mismatch or expired subscription
        if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 403 || err.statusCode === 401) {
          console.log(`[PUSH] Cleaning up invalid/expired subscription endpoint (Status ${err.statusCode}): ${subRecord.endpoint.substring(0, 30)}...`);
          await removePushSubscription(subRecord.endpoint);
        } else {
          console.error(`[PUSH ERROR] Failed to send push to ${subRecord.endpoint.substring(0, 30)}... (Status ${err.statusCode}):`, err.message || err);
        }
      }
    }

    console.log(`[PUSH] 🌐 Dispatched Web Push to ${subscriptions.length} device(s) for user ${userId} (Success: ${successCount})`);
  } catch (error: any) {
    console.error('Error sending push notification to user:', error.message || error);
  }
  return successCount;
}
