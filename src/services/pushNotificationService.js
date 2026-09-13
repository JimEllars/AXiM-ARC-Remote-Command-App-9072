import { supabaseClient } from './supabaseClient';

function decodeVapidKey(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function serializeSubscription(subscription) {
  const value = subscription.toJSON();
  return {
    endpoint: value.endpoint,
    p256dh: value.keys?.p256dh,
    auth_key: value.keys?.auth,
    user_agent: navigator.userAgent,
    device_label: 'Executive Mobile'
  };
}

export async function enablePushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported on this device.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const registration = await navigator.serviceWorker.ready;
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error('The VAPID public key is not configured.');

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidKey(publicKey)
  });

  const subData = serializeSubscription(subscription);

  const response = await fetch('/api/remote/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subData)
  });

  if (!response.ok) throw new Error('Device registration failed.');

  // Upsert to Supabase
  const { error } = await supabaseClient
    .from('executive_device_subscriptions')
    .upsert({
       user_email: 'james.ellars@axim.us.com',
       endpoint: subData.endpoint,
       p256dh: subData.p256dh,
       auth_key: subData.auth_key,
       user_agent: subData.user_agent,
       updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' });

  if (error) {
     console.error('Supabase push registration error', error);
  }

  return subscription;
}
