import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const checkSubscriptionState = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const existingSub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!existingSub);
    } catch (err) {
      console.error('Error checking service worker push registration:', err);
    }
  }, []);

  useEffect(() => {
    checkSubscriptionState();
  }, [checkSubscriptionState]);

  const subscribe = async () => {
    if (!isSupported) return false;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission !== 'granted') {
        setStatusMessage('Izin notifikasi ditolak oleh browser.');
        setIsLoading(false);
        return false;
      }

      // Fetch VAPID Public Key
      const keyRes = await fetch(`${API_BASE_URL}/api/notifications/vapid-key`);
      const keyJson = await keyRes.json();
      if (!keyJson.success || !keyJson.publicKey) {
        throw new Error('Gagal mengambil VAPID Public Key dari server.');
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey).buffer as ArrayBuffer,
        });
      }

      const token = localStorage.getItem('lifeos_token');
      const subRes = await fetch(`${API_BASE_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subscription }),
      });

      const subJson = await subRes.json();
      if (subJson.success) {
        setIsSubscribed(true);
        setStatusMessage('Web Push Notification berhasil diaktifkan! 🔔');
        return true;
      } else {
        throw new Error(subJson.message || 'Gagal menyimpan subscription ke server.');
      }
    } catch (err: any) {
      console.error('Error subscribing to push:', err);
      setStatusMessage(err.message || 'Gagal mengaktifkan notifikasi push.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const token = localStorage.getItem('lifeos_token');
        await fetch(`${API_BASE_URL}/api/notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setStatusMessage('Web Push Notification dinonaktifkan.');
      return true;
    } catch (err: any) {
      console.error('Error unsubscribing from push:', err);
      setStatusMessage(err.message || 'Gagal menonaktifkan notifikasi push.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestPush = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const token = localStorage.getItem('lifeos_token');
      const res = await fetch(`${API_BASE_URL}/api/notifications/test-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage(json.message);
        return true;
      } else {
        throw new Error(json.message || 'Gagal mengirim push test');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Koneksi error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    statusMessage,
    subscribe,
    unsubscribe,
    sendTestPush,
  };
}
