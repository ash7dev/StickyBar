'use client';

import { useEffect, useState } from 'react';
import { Bell, BellRing, BellOff, Send, Loader2, Smartphone, ShieldCheck, Sparkles, Check } from 'lucide-react';
import {
  checkPushSubscriptionStatus,
  subscribeToPushNotifications,
  sendTestPushNotification,
  type PushStatus,
} from '@/lib/pwa/push-manager';
import { cn } from '@/lib/utils/cn';

interface PushNotificationWidgetProps {
  userId?: string;
  variant?: 'card' | 'compact';
}

export function PushNotificationWidget({ userId, variant = 'card' }: PushNotificationWidgetProps) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const refreshStatus = async () => {
    const s = await checkPushSubscriptionStatus();
    setStatus(s);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleEnablePush = async () => {
    setLoading(true);
    setFeedback(null);

    const result = await subscribeToPushNotifications(userId);
    setLoading(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: 'Notifications Push activées avec succès !',
      });
      await refreshStatus();
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Erreur lors de l\'activation des notifications Push.',
      });
    }
  };

  const handleSendTestNotification = async () => {
    setTestLoading(true);
    setFeedback(null);

    const result = await sendTestPushNotification(
      'Klef - Notification Test Instantanée 🚀',
      'Votre système de notifications Push Web PWA fonctionne parfaitement en temps réel !',
      '/explorer'
    );
    setTestLoading(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: 'Notification de test envoyée ! Regardez le haut de votre écran ou votre centre de notifications.',
      });
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Impossible d\'envoyer la notification de test.',
      });
    }
  };

  if (!status) {
    return null;
  }

  if (!status.isSupported) {
    return (
      <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-600 flex items-center gap-2">
        <BellOff className="w-4 h-4 text-neutral-400" />
        <span>Les notifications Push Web ne sont pas supportées par votre navigateur.</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {status.isSubscribed ? (
          <button
            onClick={handleSendTestNotification}
            disabled={testLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-900 text-lime-300 font-extrabold text-xs shadow-xs hover:bg-forest-950 active:scale-95 transition-all"
          >
            {testLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Tester Push PWA</span>
          </button>
        ) : (
          <button
            onClick={handleEnablePush}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime-400 text-forest-950 font-black text-xs shadow-xs hover:bg-lime-300 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
            <span>Activer Push</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-border bg-background-card p-5 sm:p-6 shadow-sm relative overflow-hidden">
      {/* Halo décoratif vert forêt / lime */}
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-lime-400/15 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs',
            status.isSubscribed ? 'bg-forest-900 text-lime-300' : 'bg-lime-100 text-forest-900'
          )}>
            {status.isSubscribed ? <BellRing className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-foreground">Notifications Push Web PWA</h3>
              {status.isSubscribed && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-lime-400 text-forest-950 text-[10px] font-black uppercase tracking-wider">
                  <Check className="w-3 h-3" /> Activées
                </span>
              )}
            </div>
            <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
              Recevez les confirmations de réservation, messages et rappels en temps réel sur cet appareil (Mac, PC, Android, iPhone).
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {!status.isSubscribed ? (
            <button
              onClick={handleEnablePush}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-forest-900 text-lime-300 hover:bg-forest-950 font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-lime-300" /> : <Bell className="w-4 h-4 text-lime-300" />}
              <span>Activer les notifications Push</span>
            </button>
          ) : (
            <button
              onClick={handleSendTestNotification}
              disabled={testLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-lime-400 text-forest-950 hover:bg-lime-300 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {testLoading ? <Loader2 className="w-4 h-4 animate-spin text-forest-950" /> : <Send className="w-4 h-4 text-forest-950" />}
              <span>Tester une notification 🚀</span>
            </button>
          )}
        </div>
      </div>

      {/* Message de retour */}
      {feedback && (
        <div className={cn(
          'mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1',
          feedback.type === 'success' ? 'bg-forest-50 text-forest-900 border border-forest-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
