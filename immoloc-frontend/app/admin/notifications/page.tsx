'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Megaphone, Send, Users, Home, UserCheck, MessageSquare, Mail, Smartphone,
  FileText, Loader2, AlertTriangle, X,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

type Canal = 'PUSH' | 'SMS' | 'EMAIL' | 'WHATSAPP';
type Cible = 'ALL' | 'HOSTS' | 'TENANTS';

interface NotificationLog {
  id: string;
  canal: string;
  contenu: string;
  statut: string;
  envoyeLe?: string;
  creeLe?: string;
  utilisateur?: { prenom?: string; nom?: string } | null;
}

const CANAUX: { id: Canal; label: string; icon: typeof Smartphone; note?: string }[] = [
  { id: 'PUSH', label: 'Push', icon: Smartphone },
  { id: 'SMS', label: 'SMS', icon: MessageSquare, note: 'Facturé par message envoyé' },
  { id: 'EMAIL', label: 'E-mail', icon: Mail },
  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, note: 'Modèle validé requis' },
];

const CIBLES: { id: Cible; label: string; icon: typeof Users }[] = [
  { id: 'ALL', label: 'Tous les inscrits', icon: Users },
  { id: 'HOSTS', label: 'Propriétaires', icon: Home },
  { id: 'TENANTS', label: 'Voyageurs', icon: UserCheck },
];

/* Limites réelles des canaux : rien n'empêchait d'écrire 800 caractères pour
   un SMS, qui serait facturé en six segments ou tronqué. */
const LIMITES: Record<Canal, { titre: number; message: number }> = {
  PUSH: { titre: 60, message: 160 },
  SMS: { titre: 0, message: 320 },
  EMAIL: { titre: 90, message: 2000 },
  WHATSAPP: { titre: 60, message: 900 },
};

export default function AdminNotificationsPage() {
  const [titre, setTitre] = useState('');
  const [messageText, setMessageText] = useState('');
  const [canal, setCanal] = useState<Canal>('PUSH');
  const [cible, setCible] = useState<Cible>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const titreId = useId();
  const messageId = useId();
  const mounted = useRef(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      if (mounted.current) setToast(null);
    }, 6000);
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await adminApi.listNotificationLogs();
      if (mounted.current) setLogs(res?.data ?? []);
    } catch {
      /* Le catch était vide avec le commentaire « Catch empty logs » :
         une panne de l'API affichait « Aucune notification enregistrée »,
         donc impossible de distinguer un journal vide d'un journal cassé. */
      if (mounted.current) notify('error', 'Impossible de charger le journal des envois.');
    } finally {
      if (mounted.current) setIsLoadingLogs(false);
    }
  }, [notify]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const limites = LIMITES[canal];
  const titreTrim = titre.trim();
  const messageTrim = messageText.trim();
  const needsTitre = limites.titre > 0;

  const isValid =
    (!needsTitre || (titreTrim.length > 0 && titreTrim.length <= limites.titre)) &&
    messageTrim.length > 0 &&
    messageTrim.length <= limites.message;

  const sendBroadcast = useCallback(async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      const res = await adminApi.broadcastNotification({
        titre: titreTrim,
        message: messageTrim,
        canal,
        cible,
      });
      if (!mounted.current) return;

      const total = res?.destinatairesTotal ?? 0;
      const push = res?.pushSentCount ?? 0;
      notify(
        'success',
        canal === 'PUSH'
          ? `${total} compte(s) notifié(s), ${push} appareil(s) joint(s).`
          : `${total} destinataire(s) enregistré(s) pour envoi.`,
      );
      setTitre('');
      setMessageText('');
      loadLogs();
    } catch (err) {
      if (!mounted.current) return;
      notify('error', err instanceof Error && err.message ? err.message : 'La diffusion a échoué.');
    } finally {
      if (mounted.current) setIsSubmitting(false);
    }
  }, [titreTrim, messageTrim, canal, cible, notify, loadLogs]);

  const cibleLabel = useMemo(
    () => CIBLES.find((c) => c.id === cible)?.label.toLowerCase() ?? '',
    [cible],
  );
  const canalLabel = useMemo(
    () => CANAUX.find((c) => c.id === canal)?.label ?? '',
    [canal],
  );

  return (
    <AdminShell>
      <div className="space-y-6">

        {toast && (
          <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'fixed right-6 bottom-6 z-100 max-w-sm rounded-card border px-4 py-3 text-xs font-semibold shadow-xl',
              toast.type === 'error'
                ? 'border-error-500/25 bg-error-50 text-error-700'
                : 'border-success-500/25 bg-success-50 text-success-700',
            )}
          >
            {toast.message}
          </div>
        )}

        <header>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
            <Megaphone className="h-6 w-6 text-forest-700" aria-hidden="true" />
            Diffusion de notifications
          </h1>
          {/* « la communauté ImmoLoc » : ancien nom du produit. */}
          <p className="mt-1 text-sm text-foreground-muted">
            Messages d’information, alertes de maintenance ou annonces à la communauté Klef.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Composition ────────────────────────────────────────────── */}

          <section className="space-y-5 rounded-card border border-border bg-background-card p-6 shadow-sm lg:col-span-2">
            <div className="border-b border-border pb-3">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <Send className="h-5 w-5 text-forest-700" aria-hidden="true" />
                Nouveau message
              </h2>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); if (isValid) setShowConfirm(true); }}
              className="space-y-5"
            >
              {/* Canal — quatre <button> identiques recopiés à la main. */}
              <fieldset disabled={isSubmitting}>
                <legend className="eyebrow mb-2 block text-foreground-muted">Canal</legend>
                <div role="radiogroup" aria-label="Canal de diffusion" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CANAUX.map(({ id, label, icon: Icon }) => {
                    const active = canal === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setCanal(id)}
                        className={cn(
                          'flex h-10 items-center justify-center gap-1.5 rounded-inner border text-sm font-semibold transition-colors',
                          active
                            ? 'border-forest-600 bg-forest-50 text-forest-700'
                            : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt',
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
                {CANAUX.find((c) => c.id === canal)?.note && (
                  <p className="mt-2 text-xs text-warning-700">
                    {CANAUX.find((c) => c.id === canal)?.note}
                  </p>
                )}
              </fieldset>

              <fieldset disabled={isSubmitting}>
                <legend className="eyebrow mb-2 block text-foreground-muted">Audience</legend>
                <div role="radiogroup" aria-label="Audience cible" className="grid grid-cols-3 gap-2">
                  {CIBLES.map(({ id, label, icon: Icon }) => {
                    const active = cible === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setCible(id)}
                        className={cn(
                          'flex h-10 items-center justify-center gap-1.5 rounded-inner border text-sm font-semibold transition-colors',
                          active
                            ? 'border-forest-600 bg-forest-50 text-forest-700'
                            : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt',
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {needsTitre && (
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor={titreId} className="eyebrow text-foreground-muted">Titre</label>
                    <span className={cn(
                      'text-xs tabular-nums',
                      titreTrim.length > limites.titre ? 'font-semibold text-error-700' : 'text-foreground-muted',
                    )}>
                      {titreTrim.length} / {limites.titre}
                    </span>
                  </div>
                  <input
                    id={titreId}
                    type="text"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Maintenance planifiée, nouvelle fonctionnalité…"
                    className="w-full rounded-field border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor={messageId} className="eyebrow text-foreground-muted">Message</label>
                  <span className={cn(
                    'text-xs tabular-nums',
                    messageTrim.length > limites.message ? 'font-semibold text-error-700' : 'text-foreground-muted',
                  )}>
                    {messageTrim.length} / {limites.message}
                  </span>
                </div>
                <textarea
                  id={messageId}
                  rows={5}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Texte complet de votre annonce."
                  className="w-full resize-none rounded-field border border-border bg-background p-3 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
                <p className="mr-auto text-xs text-foreground-muted">
                  Envoi par <span className="font-semibold text-foreground">{canalLabel}</span> aux{' '}
                  <span className="font-semibold text-foreground">{cibleLabel}</span>
                </p>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-pill bg-button-primary px-6 py-2.5 text-sm font-semibold text-on-button-primary transition-colors hover:bg-button-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    : <Send className="h-4 w-4" aria-hidden="true" />}
                  {isSubmitting ? 'Diffusion…' : 'Continuer'}
                </button>
              </div>
            </form>
          </section>

          {/* ── Journal ────────────────────────────────────────────────── */}

          <section className="space-y-4 rounded-card border border-border bg-background-card p-6 shadow-sm">
            <div className="border-b border-border pb-3">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <FileText className="h-5 w-5 text-forest-700" aria-hidden="true" />
                Journal
                <span className="font-normal tabular-nums text-foreground-muted">{logs.length}</span>
              </h2>
            </div>

            {isLoadingLogs ? (
              <div className="space-y-3" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-inner bg-background-alt" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="space-y-1 py-8 text-center">
                <Megaphone className="mx-auto h-8 w-8 text-foreground-muted opacity-40" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">Aucun envoi</p>
                <p className="text-xs text-foreground-muted">
                  Vos diffusions apparaîtront ici.
                </p>
              </div>
            ) : (
              <ul className="no-scrollbar max-h-[420px] space-y-3 overflow-y-auto">
                {logs.map((log) => {
                  const dest = log.utilisateur
                    ? [log.utilisateur.prenom, log.utilisateur.nom].filter(Boolean).join(' ')
                    : 'Destinataire';
                  const date = log.envoyeLe ?? log.creeLe;

                  return (
                    <li key={log.id} className="space-y-1.5 rounded-inner border border-border bg-background-alt p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {dest || 'Destinataire'}
                        </span>
                        <span className="shrink-0 rounded-pill border border-forest-100 bg-forest-50 px-2 py-0.5 text-xs font-semibold uppercase text-forest-700">
                          {log.canal}
                        </span>
                      </div>
                      <p className="text-xs leading-snug text-foreground line-clamp-2">
                        {log.contenu}
                      </p>
                      <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5 text-xs text-foreground-muted">
                        <span>{log.statut}</span>
                        {date && (
                          <time dateTime={date}>
                            {new Date(date).toLocaleDateString('fr-FR')}
                          </time>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ── Confirmation ───────────────────────────────────────────────
            Un clic envoyait à toute la base, sans retour possible et sans
            savoir combien de personnes étaient concernées. */}

        {showConfirm && (
          <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-forest-950/70 p-4 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label="Confirmer la diffusion"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md space-y-4 rounded-card border border-border bg-background-card p-6 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-inner border border-warning-500/25 bg-warning-50 text-warning-600">
                  <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                </span>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  aria-label="Fermer"
                  className="rounded-pill p-1.5 text-foreground-muted hover:bg-background-alt"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Confirmer la diffusion
                </h2>
                <p className="text-sm leading-relaxed text-foreground-muted">
                  Ce message part par <strong className="font-semibold text-foreground">{canalLabel}</strong>{' '}
                  à <strong className="font-semibold text-foreground">{cibleLabel}</strong>. Un envoi
                  ne peut pas être annulé.
                </p>
              </div>

              <div className="space-y-1 rounded-inner border border-border bg-background-alt p-3">
                {needsTitre && (
                  <p className="text-sm font-semibold text-foreground">{titreTrim}</p>
                )}
                <p className="text-xs leading-relaxed text-foreground-muted">{messageTrim}</p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-pill border border-border bg-background-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-background-alt"
                >
                  Revenir
                </button>
                <button
                  type="button"
                  onClick={sendBroadcast}
                  className="inline-flex items-center gap-2 rounded-pill bg-button-primary px-5 py-2 text-sm font-semibold text-on-button-primary hover:bg-button-primary-hover"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Diffuser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}