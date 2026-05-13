import webpush from 'web-push';
import { appConfig } from '../config/index.js';

let configured = false;

function setup() {
  if (configured) return;
  const { publicKey, privateKey, email } = appConfig.vapid ?? {};
  if (!publicKey || !privateKey || !email) return;
  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title:   string;
  body:    string;
  url?:    string;
  icon?:   string;
}

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<void> {
  setup();
  if (!configured) return;
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys:     { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    if (e.statusCode === 410 || e.statusCode === 404) {
      // Subscription expired — caller should delete it
      throw Object.assign(new Error('Subscription expired'), { expired: true });
    }
  }
}

