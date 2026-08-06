'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, BellOff, Send, Loader2, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  checkPushSubscriptionStatus,
  subscribeToPushNotifications,
  sendTestPushNotification,
  type PushStatus,
} from '@/lib/pwa/push-manager';
import { playNotificationChime } from '@/lib/pwa/sound-effects';

const TEST_TITLE = 'Klef — notification de test';
const TEST_BODY = 'Vos notifications fonctionnent sur cet appareil.';
const TEST_URL = '/explorer';

interface Props {
  userId?: string;
  variant?: 'card' | 'compact';
}

export function PushNotificationWidget({ userId, variant = 'card' }: Props) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  /* Le composant faisait des setState après démontage : `refreshStatus` et
     les deux handlers sont asynchrones et ne vérifiaient rien au retour. */
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const refreshStatus = useCallback(async () => {
    const s = await checkPushSubscriptionStatus();
    if (mounted.current) setStatus(s);
  }, []);

  useEffect(() => {
    refreshStatus();

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_NOTIFICATION_SOUND') playNotificationChime();
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [refreshStatus]);

  /* Le message restait affiché indéfiniment, y compris après changement d'état. */
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 8_000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleEnablePush = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    const result = await subscribeToPushNotifications(userId);
    if (!mounted.current) return;
    setLoading(false);

    if (result.success) {
      setFeedback({ type: 'success', message: 'Notifications activées sur cet appareil.' });
      await refreshStatus();
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'L’activation n’a pas abouti. Vérifiez les autorisations du navigateur.',
      });
    }
  }, [userId, refreshStatus]);

  const handleSendTest = useCallback(async () => {
    setTestLoading(true);
    setFeedback(null);

    let result = await sendTestPushNotification(TEST_TITLE, TEST_BODY, TEST_URL);

    /* Réabonnement automatique si l'appareil n'est plus en base.
       ⚠️ Le test portait sur `message?.includes('Aucun appareil')` : toute
       reformulation du message serveur cassait silencieusement ce repli.
       À remplacer par un code d'erreur stable côté API. */
    if (!result.success && result.message?.includes('Aucun appareil')) {
      const resub = await subscribeToPushNotifications(userId);
      if (resub.success) {
        await refreshStatus();
        result = await sendTestPushNotification(TEST_TITLE, TEST_BODY, TEST_URL);
      }
    }

    if (!mounted.current) return;
    setTestLoading(false);

    if (result.success) {
      playNotificationChime();
      setFeedback({ type: 'success', message: 'Notification envoyée. Vérifiez le haut de votre écran.' });
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'L’envoi de la notification de test a échoué.',
      });
    }
  }, [userId, refreshStatus]);

  /* `if (!status) return null` masquait le widget pendant tout le temps de la
     vérification, sans rien annoncer. On réserve la place. */
  if (!status) {
    return variant === 'compact' ? (
      <div className="h-8 w-36 animate-pulse rounded-pill bg-border" aria-hidden="true" />
    ) : (
      <div
        aria-busy="true"
        className="h-28 animate-pulse rounded-card border border-border bg-background-alt"
      >
        <span className="sr-only">Vérification des notifications…</span>
      </div>
    );
  }

  if (!status.isSupported) {
    return (
      <div className="flex items-center gap-2 rounded-inner border border-border bg-background-alt p-4 text-xs text-foreground-muted">
        <BellOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        Les notifications ne sont pas prises en charge par ce navigateur.
      </div>
    );
  }

  /* ── Variante compacte ─────────────────────────────────────────────────── */

  if (variant === 'compact') {
    return status.isSubscribed ? (
      <button
        type="button"
        onClick={handleSendTest}
        disabled={testLoading}
        className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-background-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt disabled:opacity-50"
      >
        {testLoading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
        Tester
      </button>
    ) : (
      /* ★ Seul aplat lime : l'activation, l'action attendue. */
      <button
        type="button"
        onClick={handleEnablePush}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-pill bg-action px-3 py-1.5 text-xs font-semibold text-on-action shadow-action transition-[background-color,transform] hover:bg-action-hover active:scale-[0.98] disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          : <Bell className="h-3.5 w-3.5" aria-hidden="true" />}
        Activer
      </button>
    );
  }

  /* ── Variante carte ────────────────────────────────────────────────────── */

  return (
    <section className="rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div className="flex min-w-0 items-start gap-3.5">
          <span className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-inner border',
            status.isSubscribed
              ? 'border-forest-100 bg-forest-50 text-forest-700'
              : 'border-border bg-background-alt text-foreground-muted',
          )}>
            {status.isSubscribed
              ? <BellRing className="h-5 w-5" aria-hidden="true" />
              : <Bell className="h-5 w-5" aria-hidden="true" />}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold text-foreground">
                Notifications
              </h3>
              {status.isSubscribed && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-xs font-semibold text-gold-700">
                  <Check className="h-3 w-3" aria-hidden="true" />
                  Activées
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
              Recevez les confirmations de réservation, les messages et les rappels en temps réel
              sur cet appareil.
            </p>
          </div>
        </div>

        <div className="sm:shrink-0">
          {status.isSubscribed ? (
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testLoading}
              className="flex w-full items-center justify-center gap-2 rounded-pill border border-border bg-background-card px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt disabled:opacity-50 sm:w-auto"
            >
              {testLoading
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : <Send className="h-4 w-4" aria-hidden="true" />}
              Envoyer un test
            </button>
          ) : (
            /* ★ Seul aplat lime de la carte. */
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-pill bg-action px-5 py-2.5 text-xs font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover hover:shadow-action-hover active:scale-[0.98] disabled:opacity-50 sm:w-auto"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : <Bell className="h-4 w-4" aria-hidden="true" />}
              Activer les notifications
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'mt-4 flex items-start gap-2 rounded-inner border p-3 text-xs leading-relaxed',
            feedback.type === 'success'
              ? 'border-success-500/25 bg-success-50 text-success-700'
              : 'border-error-500/20 bg-error-50 text-error-700',
          )}
        >
          {feedback.type === 'success'
            ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <span>{feedback.message}</span>
        </div>
      )}
    </section>
  );
}