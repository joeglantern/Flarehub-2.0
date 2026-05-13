import { api } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    const reg = await registerServiceWorker();
    if (!reg) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const { data } = await api.get<{ success: boolean; data: { publicKey: string } }>('/push/vapid-public-key');
    if (!data.data.publicKey) return false;

    const applicationServerKey = urlBase64ToUint8Array(data.data.publicKey);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    await api.post('/push/subscribe', subscription.toJSON());
    return true;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await api.delete('/push/subscribe', { data: { endpoint: sub.endpoint } });
    await sub.unsubscribe();
  } catch {
    // ignore
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
