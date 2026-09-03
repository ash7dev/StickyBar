'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Wallet, Smartphone, Save, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';

type Operateur = 'WAVE' | 'ORANGE_MONEY';

interface PayoutSettings {
  methode: Operateur;
  numeroRetrait: string;
}

const OPERATEURS: { value: Operateur; label: string }[] = [
  { value: 'WAVE', label: 'Wave' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
];

/** Mobile sénégalais : 7 suivi de 0/5/6/7/8, puis 7 chiffres. */
const SN_MOBILE = /^(?:\+?221)?7[05678]\d{7}$/;

const normalise = (v: string) => v.replace(/[\s.\-()]/g, '');

/** 77 123 45 67 — groupé à la sénégalaise pour la relecture. */
function formatSN(raw: string) {
  const d = normalise(raw).replace(/^\+?221/, '');
  if (d.length !== 9) return raw;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

interface Props {
  telephoneInitial?: string;
}

export function OwnerPayoutSettingsCard({ telephoneInitial = '' }: Props) {
  const [methode, setMethode] = useState<Operateur>('WAVE');
  const [numero, setNumero] = useState(telephoneInitial);
  const [saved, setSaved] = useState<PayoutSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numeroId = useId();
  const hintId = useId();
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

  /* Les coordonnées de retrait doivent venir du serveur, pas d'un défaut
     local : afficher « Wave » par défaut alors que l'utilisateur a
     enregistré Orange Money lui fait croire que son réglage a été perdu. */
  useEffect(() => {
    (async () => {
      try {
        const data = await nestFetch<PayoutSettings>(NEST_API.USERS.PAYOUT_SETTINGS);
        if (!mounted.current) return;
        if (data?.methode) setMethode(data.methode);
        if (data?.numeroRetrait) setNumero(formatSN(data.numeroRetrait));
        setSaved(data ?? null);
      } catch {
        if (!mounted.current) return;
        setError('Impossible de charger vos coordonnées de retrait. Rechargez la page.');
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    })();
  }, []);

  const digits = normalise(numero);
  const isValid = SN_MOBILE.test(digits);
  const isDirty =
    !saved || saved.methode !== methode || normalise(saved.numeroRetrait) !== digits;

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    /* Aucune validation auparavant : une faute de frappe envoyait les
       reversements vers un numéro inexistant, sans le moindre contrôle. */
    if (!isValid) {
      setError('Numéro invalide. Saisissez un mobile sénégalais à 9 chiffres, par exemple 77 123 45 67.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: PayoutSettings = {
        methode,
        numeroRetrait: digits.replace(/^\+?221/, ''),
      };
      await nestFetch(NEST_API.USERS.PAYOUT_SETTINGS, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!mounted.current) return;
      setSaved(payload);
      setNumero(formatSN(payload.numeroRetrait));
      setSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => {
        if (mounted.current) setSuccess(false);
      }, 5000);
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
  }, [isValid, methode, digits]);

  const operateurLabel = useMemo(
    () => OPERATEURS.find((o) => o.value === methode)?.label ?? '',
    [methode],
  );

  return (
    <section className="card space-y-6 p-6 sm:p-8">

      <header className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Coordonnées de retrait
          </h2>
          <p className="text-xs text-foreground-muted">
            Le compte Mobile Money qui reçoit vos revenus de location
          </p>
        </div>
      </header>

      <div aria-live="polite" className="empty:hidden">
        {success && (
          <div className="flex items-center gap-3 rounded-inner border border-success-500/25 bg-success-50 p-3.5 text-xs text-success-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Coordonnées enregistrées : {operateurLabel} · {formatSN(numero)}
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
          <span className="sr-only">Chargement de vos coordonnées…</span>
          <div className="h-12 max-w-md animate-pulse rounded-pill bg-background-alt" />
          <div className="h-12 max-w-md animate-pulse rounded-field bg-background-alt" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <fieldset disabled={isSaving} className="space-y-5">

            <div>
              <legend id={groupId} className="eyebrow mb-2 block">Opérateur</legend>
              <div role="radiogroup" aria-labelledby={groupId} className="grid max-w-md grid-cols-2 gap-3">
                {OPERATEURS.map(({ value, label }) => {
                  const active = methode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => { setMethode(value); setSuccess(false); }}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-pill border px-4 py-3 text-sm font-semibold transition-colors',
                        active
                          ? 'border-forest-600 bg-forest-50 text-forest-700'
                          : 'border-border bg-background-alt text-foreground-muted hover:border-border-hover hover:bg-background-card',
                      )}
                    >
                      <Smartphone className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-md">
              <label htmlFor={numeroId} className="eyebrow mb-2 block">
                Numéro de réception
              </label>
              <PhoneInputWithCountry
                id={numeroId}
                value={numero}
                onChange={(val) => { setNumero(val); setSuccess(false); }}
              />
              <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-foreground-muted">
                Ce numéro est présélectionné lors de vos demandes de retrait — vérifiez-le, c’est lui qui reçoit vos fonds.
              </p>
            </div>

            {/* Un changement de coordonnées bancaires mérite d'être relu
                avant validation, pas seulement confirmé après. */}
            {isDirty && isValid && (
              <div className="flex items-start gap-3 rounded-inner border border-warning-500/25 bg-warning-50 p-3.5 max-w-md">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-warning-700">
                  Vos prochains reversements seront envoyés sur{' '}
                  <span className="font-semibold tabular-nums">{formatSN(numero)}</span> via{' '}
                  <span className="font-semibold">{operateurLabel}</span>.
                </p>
              </div>
            )}
          </fieldset>

          <div className="flex items-center justify-end gap-3">
            {isDirty && (
              <p className="text-xs text-foreground-muted">Modifications non enregistrées</p>
            )}
            <button
              type="submit"
              disabled={isSaving || !isDirty || !isValid}
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