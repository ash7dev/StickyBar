import { NEST_API } from '@/lib/nestjs/endpoints';

/**
 * Convertit une clé VAPID encodée en Base64 URL Safe en Uint8Array pour l'API Push du navigateur.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Enregistre le Service Worker `public/sw.js` s'il n'est pas déjà enregistré.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('[PWA] Échec enregistrement Service Worker:', error);
    return null;
  }
}

/**
 * Récupère la clé publique VAPID du backend NestJS.
 */
export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(NEST_API.PUSH_NOTIFICATIONS.VAPID_PUBLIC_KEY);
    if (!res.ok) throw new Error('Impossible de récupérer la clé VAPID publique');
    const data = await res.json();
    return data.publicKey;
  } catch (error) {
    console.error('[PWA] Échec récupération VAPID key:', error);
    return null;
  }
}

export interface PushStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  endpoint: string | null;
}

/**
 * Vérifie le statut actuel du support Push et de l'abonnement de cet appareil.
 */
export async function checkPushSubscriptionStatus(): Promise<PushStatus> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      isSupported: false,
      permission: 'denied',
      isSubscribed: false,
      endpoint: null,
    };
  }

  const permission = Notification.permission;
  const registration = await registerServiceWorker();

  if (!registration) {
    return { isSupported: true, permission, isSubscribed: false, endpoint: null };
  }

  const existingSubscription = await registration.pushManager.getSubscription();

  return {
    isSupported: true,
    permission,
    isSubscribed: Boolean(existingSubscription),
    endpoint: existingSubscription ? existingSubscription.endpoint : null,
  };
}

/**
 * Demande l'autorisation et abonne cet appareil aux notifications Push Web.
 */
export async function subscribeToPushNotifications(userId?: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'Les notifications Push ne sont pas supportées sur cet appareil.' };
  }

  try {
    // 1. Demande d'autorisation au navigateur
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permission refusée par l\'utilisateur.' };
    }

    // 2. Service Worker ready
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, error: 'Service Worker indisponible.' };
    }

    // 3. Clé VAPID publique depuis NestJS
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      return { success: false, error: 'Impossible de contacter le serveur de notifications VAPID.' };
    }

    // 4. Inscription auprès du PushManager du navigateur
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey.buffer as ArrayBuffer,
      });
    }

    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
      return { success: false, error: 'Format d\'abonnement Push invalide généré par le navigateur.' };
    }

    // 5. Envoi au backend NestJS pour enregistrement en BD
    const res = await fetch(NEST_API.PUSH_NOTIFICATIONS.SUBSCRIBE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
        },
        userId: userId || undefined,
        userAgent: navigator.userAgent,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Erreur lors de l\'enregistrement backend.');
    }

    return { success: true };
  } catch (err: any) {
    console.error('[PWA Push Error]', err);
    return { success: false, error: err.message || 'Erreur d\'abonnement Push.' };
  }
}

/**
 * Envoie une notification Push de test instantanée depuis le backend vers cet appareil.
 */
export async function sendTestPushNotification(title?: string, message?: string, url?: string): Promise<{ success: boolean; sentCount?: number; message?: string }> {
  try {
    console.log('[PWA] Sending test notification...');

    const registration = await registerServiceWorker();
    console.log('[PWA] Service Worker registration:', registration ? 'OK' : 'FAILED');

    const sub = registration ? await registration.pushManager.getSubscription() : null;
    console.log('[PWA] Push subscription:', sub ? 'EXISTS' : 'NOT FOUND');

    if (sub) {
      console.log('[PWA] Subscription endpoint:', sub.endpoint);
    }

    const apiUrl = NEST_API.PUSH_NOTIFICATIONS.TEST;
    console.log('[PWA] Calling API:', apiUrl);

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub?.endpoint || undefined,
        title: title || 'Klef - Test Notification 🚀',
        message: message || 'Vos notifications Push Web PWA fonctionnent parfaitement !',
        url: url || '/explorer',
      }),
    });

    console.log('[PWA] API response status:', res.status);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[PWA] API error response:', err);
      throw new Error(err.message || 'Erreur lors de l\'envoi du Push test.');
    }

    const result = await res.json();
    console.log('[PWA] API success response:', result);
    return result;
  } catch (err: any) {
    console.error('[PWA Test Error]', err);
    return { success: false, message: err.message };
  }
}
