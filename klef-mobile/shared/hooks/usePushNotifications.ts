import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { PushNotificationsService } from '../services/push-notifications.service';

import { useRoleStore } from '../stores/role.store';

// Configuration du comportement des notifications reçues lorsque l'application est ouverte (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Normalise les URL Web (ex: /reservations?id=123) en routes natives Expo Router (/reservation/123)
 */
function normalizeDeepLinkUrl(rawUrl: string, activeRole?: any): string {
  if (!rawUrl) return '/(tenant)';

  // Si c'est déjà une route Expo Router native complète
  if (
    rawUrl.startsWith('/(') ||
    rawUrl.startsWith('/reservation/') ||
    rawUrl.startsWith('/support/') ||
    rawUrl.startsWith('/listing/') ||
    rawUrl === '/assistance'
  ) {
    return rawUrl;
  }

  // 1. Redirection Réservation: `/reservations?id=123` ou `/reservations/123` -> `/reservation/123`
  const resMatch = rawUrl.match(/\/reservations(?:\?id=|\/)([a-zA-Z0-9-]+)/);
  if (resMatch && resMatch[1]) {
    return `/reservation/${resMatch[1]}`;
  }
  if (rawUrl === '/reservations' || rawUrl === '/gestionnaire/reservations') {
    return activeRole === 'OWNER' ? '/(owner)/reservations' : '/(tenant)/reservations';
  }

  // 2. Redirection Ticket Support: `/support?id=123` -> `/support/123`
  const supportMatch = rawUrl.match(/\/support(?:\?id=|\/)([a-zA-Z0-9-]+)/);
  if (supportMatch && supportMatch[1]) {
    return `/support/${supportMatch[1]}`;
  }
  if (rawUrl === '/support') {
    return '/assistance';
  }

  // 3. Redirection Logement: `/logement/123` -> `/listing/123`
  const listingMatch = rawUrl.match(/\/logements?(?:\?id=|\/)([a-zA-Z0-9-]+)/);
  if (listingMatch && listingMatch[1]) {
    return `/listing/${listingMatch[1]}`;
  }

  // 4. Redirection Portefeuille / Virements -> `/(owner)/wallet`
  if (rawUrl === '/wallet' || rawUrl === '/gestionnaire/virements' || rawUrl === '/parametres') {
    return activeRole === 'OWNER' ? '/(owner)/wallet' : '/(tenant)/profile';
  }

  // 5. Redirection Profil -> `/(tenant)/profile` ou `/(owner)/profile`
  if (rawUrl === '/profil') {
    return activeRole === 'OWNER' ? '/(owner)/profile' : '/(tenant)/profile';
  }

  return rawUrl;
}

export function usePushNotifications() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeRole = useRoleStore((s) => s.activeRole);

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Initialisation & Enregistrement du Token
    async function initPush() {
      const token = await PushNotificationsService.registerForPushNotificationsAsync();
      if (isMounted && token) {
        setExpoPushToken(token);
        if (isAuthenticated) {
          await PushNotificationsService.subscribeDevicePushToken(token);
        }
      }
    }

    initPush();

    // 2. Écouteur de notification reçue quand l'application est au premier plan
    notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
      console.log('[usePushNotifications] Notification reçue en 1er plan :', n.request.content.title);
      setNotification(n);
    });

    // 3. Écouteur de clic utilisateur sur la notification (Deep Linking)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((res) => {
      console.log('[usePushNotifications] Clic utilisateur sur notification :', res.notification.request.content);
      const rawTargetUrl = res.notification.request.content.data?.url;
      if (typeof rawTargetUrl === 'string' && rawTargetUrl.length > 0) {
        try {
          const targetUrl = normalizeDeepLinkUrl(rawTargetUrl, typeof activeRole === 'string' ? activeRole : undefined);
          console.log(`[usePushNotifications] Deep Link normalisé : "${rawTargetUrl}" ➔ "${targetUrl}"`);
          router.push(targetUrl as any);
        } catch (err) {
          console.warn('[usePushNotifications] Erreur de redirection Deep Link :', err);
        }
      }
    });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, router]);

  return {
    expoPushToken,
    notification,
    sendTestPush: PushNotificationsService.sendTestPushNotification,
  };
}
