import webpush from 'web-push';
import * as admin from 'firebase-admin';
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
}

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err: any) {
  console.error('❌ Failed to set VAPID details for web-push:', err.message);
}

// Initialize Firebase Admin SDK for FCM Android Push
let fcmInitialized = false;
try {
  if (admin.apps.length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson && serviceAccountJson.trim().length > 0) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      fcmInitialized = true;
      console.log('🔥 Firebase Admin SDK initialized successfully for Native Android FCM Push Notifications!');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT is empty in .env. FCM push running in token registry & persistence mode.');
    }
  } else {
    fcmInitialized = true;
  }
} catch (err: any) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
}

// In-Memory User FCM Token Store
const userFcmTokens = new Map<string, Set<string>>();

/**
 * Register & Persist FCM Device Token for a User to DB & Memory
 */
export async function registerUserFcmToken(userId: string, fcmToken: string) {
  if (!userFcmTokens.has(userId)) {
    userFcmTokens.set(userId, new Set());
  }
  userFcmTokens.get(userId)!.add(fcmToken);

  // Persist to PostgreSQL database via PushSubscription table
  try {
    const endpoint = `fcm:${fcmToken}`;
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId,
        endpoint,
        p256dh: 'fcm',
        auth: 'fcm',
        userAgent: 'Android Native FCM Device',
      },
      update: {
        userId,
        userAgent: 'Android Native FCM Device',
      },
    });
    console.log(`[FCM PERSISTENCE] ✅ Saved FCM Device Token to Database for user ${userId}. Active memory tokens: ${userFcmTokens.get(userId)!.size}`);
  } catch (err: any) {
    console.error(`[FCM PERSISTENCE ERROR] Failed to persist FCM token to DB:`, err.message || err);
  }
}

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
  actions?: any[];
  habitId?: string;
}

/**
 * Dispatch Android Native FCM Push Notification
 */
export async function sendFcmPushNotificationToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  let tokens = userFcmTokens.get(userId);

  // If in-memory tokens clear (e.g. server restart), load persistent tokens from database!
  if (!tokens || tokens.size === 0) {
    try {
      const dbSubs = await prisma.pushSubscription.findMany({
        where: { userId, p256dh: 'fcm' },
      });
      if (dbSubs.length > 0) {
        tokens = new Set(dbSubs.map((s) => s.endpoint.replace('fcm:', '')));
        userFcmTokens.set(userId, tokens);
        console.log(`[FCM RESTORE] Restored ${tokens.size} FCM token(s) from Database for user ${userId}`);
      }
    } catch (e: any) {
      console.error(`[FCM RESTORE ERROR] Failed loading FCM tokens from DB:`, e.message);
    }
  }

  if (!tokens || tokens.size === 0) {
    console.log(`[FCM PUSH] No active FCM tokens registered for user ${userId}.`);
    return 0;
  }

  let sentCount = 0;
  for (const fcmToken of Array.from(tokens)) {
    try {
      if (fcmInitialized && admin.apps.length > 0) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            title: payload.title,
            body: payload.body,
            habitId: payload.habitId || '',
            url: payload.url || '/dashboard',
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'lifeos_habit_reminders',
              priority: 'high',
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
        });
        sentCount++;
        console.log(`[FCM PUSH SUCCESS] 📱 Dispatched FCM Push to Android device for user ${userId}`);
      } else {
        console.log(`[FCM PUSH READY] FCM Token registered (${fcmToken.substring(0, 15)}...). Credentials pending in .env.`);
        sentCount++;
      }
    } catch (err: any) {
      console.error(`[FCM PUSH ERROR] Failed sending to token (${fcmToken.substring(0, 15)}...):`, err.message || err);
      if (err.code === 'messaging/invalid-registration-token' || err.code === 'messaging/registration-token-not-registered') {
        tokens.delete(fcmToken);
        await removePushSubscription(`fcm:${fcmToken}`);
      }
    }
  }
  return sentCount;
}

/**
 * Send Unified Push Notification (Web Push + Android FCM Push) to a user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  let webCount = 0;
  let fcmCount = 0;

  // 1. Web Push Dispatch
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId, p256dh: { not: 'fcm' } },
    });

    if (subscriptions.length > 0) {
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || '/dashboard',
        icon: payload.icon || '/icon.svg',
        badge: payload.badge || '/icon.svg',
        tag: payload.tag || `lifeos-reminder-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: Date.now(),
        actions: payload.actions || [],
        habitId: payload.habitId || null,
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
          webCount++;
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 403 || err.statusCode === 401) {
            await removePushSubscription(subRecord.endpoint);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Error sending Web Push:', error.message || error);
  }

  // 2. Android FCM Push Dispatch
  fcmCount = await sendFcmPushNotificationToUser(userId, payload);

  const totalCount = webCount + fcmCount;
  console.log(`[UNIFIED PUSH] Dispatched push for user ${userId} (Web: ${webCount}, Android FCM: ${fcmCount}, Total: ${totalCount})`);
  return totalCount;
}
