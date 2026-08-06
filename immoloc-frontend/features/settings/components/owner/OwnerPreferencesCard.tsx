'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Bell, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';

interface Preferences {
  instantBooking: boolean;
  whatsappAlerts: boolean;
  emailStatements: boolean;
}

const FIELDS: { key: keyof Preferences; label: string; description: string }[] = [
  {
    key: 'instantBooking',
    label: 'Réservation instantanée',
    description:
      'Les voyageurs dont l’identité est vérifiée par Klef réservent sans attendre votre validation. Vous gardez la main sur les autres demandes.',
  },
  {
    key: 'whatsappAlerts',
    label: 'Alertes WhatsApp et SMS',
    description:
      'Notification immédiate à chaque nouvelle réservation ou signalement concernant un séjour en cours.',
  },
  {
    key: 'emailStatements',
    label: 'Relevés mensuels',
    description:
      'Récapitulatifs comptables et justificatifs de reversement envoyés par e-mail au début de chaque mois.',
  },
];

/* Aucune valeur par défaut à `true` : tant que le serveur n'a pas répondu, la
   carte ne peut pas affirmer qu'un réglage est actif. */
const EMPTY: Preferences = {
  instantBooking: false,
  whatsappAlerts: false,
  emailStatements: false,
};

export function OwnerPreferencesCard() {
  const [prefs, setPrefs] = useState<Preferences>(EMPTY);
  const [saved, setSaved] = useState<Preferences>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupId = useId();
  const mounted = useRef(true);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await nestFetch<Preferences>(NEST_API.USERS.PREFERENCES);
        if (!mounted.current) return;
        setPrefs(data);
        setSaved(data);
      } catch {
        if (!mounted.current) return;
        setError('Impossible de charger vos préférences. Rechargez la page.');
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    })();
  }, []);

  const isDirty = (Object.keys(prefs) as (keyof Preferences)[])
    .some((k) => prefs[k] !== saved[k]);

  const toggle = useCallback((key: keyof Preferences, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSuccess(false);
  }, []);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      /* L'ancienne version n'appelait aucune API : un `setTimeout(500)`
         affichait « Préférences enregistrées » et rien n'était persisté. */
      await nestFetch(NEST_API.USERS.PREFERENCES, {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      });
      if (!mounted.current) return;
      setSaved(prefs);
      setSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => {
        if (mounted.current) setSuccess(false);
      }, 4000);
    } catch (err) {
      if (!mounted.current) return;
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'L’enregistrement n’a pas abouti. Réessayez dans un instant.',
      );
    } finally {
      if (mounted.current) setIsSaving(false);
    }
  }, [prefs]);

  return (
    <section className="card space-y-6 p-6 sm:p-8">

      <header className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id={groupId} className="font-display text-lg font-semibold text-foreground">
            Réservations et alertes
          </h2>
          <p className="text-xs text-foreground-muted">
            Vos règles de réservation et vos canaux de notification
          </p>
        </div>
      </header>

      <div aria-live="polite" className="empty:hidden">
        {success && (
          <div className="flex items-center gap-3 rounded-inner border border-success-500/25 bg-success-50 p-3.5 text-xs text-success-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Préférences enregistrées.
          </div>
        )}
        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-inner border border-error-500/20 bg-error-50 p-3.5 text-xs text-error-700">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}
      </div>

      {isLoading ? (
        <div aria-busy="true" className="space-y-4">
          <span className="sr-only">Chargement de vos préférences…</span>
          {FIELDS.map((f) => (
            <div key={f.key} className="h-24 animate-pulse rounded-inner bg-background-alt" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <fieldset disabled={isSaving} className="space-y-4">
            <legend className="sr-only">Préférences de réservation et de notification</legend>

            {FIELDS.map(({ key, label, description }) => (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-3.5 rounded-inner border border-border bg-background-alt p-4 transition-colors hover:border-border-hover hover:bg-background-card"
              >
                <span className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) => toggle(key, e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border-2 border-border bg-background-card transition-colors checked:border-forest-600 checked:bg-forest-600"
                  />
                  <CheckCircle2
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-neutral-0 opacity-0 peer-checked:opacity-100"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-foreground-muted">
                    {description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="flex items-center justify-end gap-3 pt-2">
            {/* Le bouton restait actif en permanence, invitant à « enregistrer »
                des réglages inchangés. */}
            {isDirty && (
              <p className="text-xs text-foreground-muted">Modifications non enregistrées</p>
            )}
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="btn-action text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}