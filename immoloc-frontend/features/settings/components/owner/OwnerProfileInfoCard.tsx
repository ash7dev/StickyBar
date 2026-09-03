'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { User, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';

interface Props {
  prenomInitial?: string;
  nomInitial?: string;
  telephoneInitial?: string;
  emailInitial?: string;
  onUpdated?: () => void;
}

const FIELD_CLS =
  'w-full rounded-field border border-border bg-background-alt px-4 py-3 text-foreground ' +
  'placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none';

export function OwnerProfileInfoCard({
  prenomInitial = '',
  nomInitial = '',
  telephoneInitial = '',
  emailInitial = '',
  onUpdated,
}: Props) {
  const [prenom, setPrenom] = useState(prenomInitial);
  const [nom, setNom] = useState(nomInitial);
  const [telephone, setTelephone] = useState(telephoneInitial);
  const [email, setEmail] = useState(emailInitial);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const prenomId = useId();
  const nomId = useId();
  const telId = useId();
  const emailId = useId();

  const isShadowEmail = emailInitial.startsWith('shadow_') || emailInitial.includes('@klef.sn');
  const mounted = useRef(true);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPristine = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isPristine.current) return;
    setPrenom(prenomInitial);
    setNom(nomInitial);
    setTelephone(telephoneInitial);
    setEmail(emailInitial);
  }, [prenomInitial, nomInitial, telephoneInitial, emailInitial]);

  const touch = useCallback(<T,>(setter: (v: T) => void) => (v: T) => {
    isPristine.current = false;
    setter(v);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const p = prenom.trim();
    const n = nom.trim();
    const t = telephone.trim();
    const em = email.trim();

    if (!p || !n) {
      setErrorMsg('Le prénom et le nom sont obligatoires.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await nestFetch(NEST_API.USERS.ME, {
        method: 'PATCH',
        body: JSON.stringify({
          prenom: p,
          nom: n,
          telephone: t || null,
          ...(em && em !== emailInitial ? { email: em } : {}),
        }),
      });

      if (!mounted.current) return;
      setPrenom(p);
      setNom(n);
      setTelephone(t);
      setEmail(em);
      isPristine.current = true;
      setSaveSuccess(true);
      onUpdated?.();

      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => {
        if (mounted.current) setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      if (!mounted.current) return;
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : 'La mise à jour n’a pas abouti. Réessayez dans un instant.',
      );
    } finally {
      if (mounted.current) setIsSaving(false);
    }
  }, [prenom, nom, telephone, email, emailInitial, onUpdated]);

  return (
    <section className="card space-y-6 p-6 sm:p-8">

      <header className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
          <User className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Informations personnelles
          </h2>
          <p className="text-xs text-foreground-muted">
            Identité affichée sur vos annonces et vos quittances
          </p>
        </div>
      </header>

      {/* `aria-live` : sans lui, un utilisateur au clavier ne sait pas que
          l'enregistrement a réussi — le focus reste sur le bouton. */}
      <div aria-live="polite" className="empty:hidden">
        {saveSuccess && (
          <div className="flex items-center gap-3 rounded-inner border border-success-500/25 bg-success-50 p-3.5 text-xs text-success-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Informations enregistrées.
          </div>
        )}
        {errorMsg && (
          <div role="alert" className="flex items-center gap-3 rounded-inner border border-error-500/20 bg-error-50 p-3.5 text-xs text-error-700">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {errorMsg}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">

          <div>
            <label htmlFor={prenomId} className="eyebrow mb-2 block">Prénom</label>
            <input
              id={prenomId}
              type="text"
              value={prenom}
              onChange={(e) => touch(setPrenom)(e.target.value)}
              autoComplete="given-name"
              required
              className={FIELD_CLS}
            />
          </div>

          <div>
            <label htmlFor={nomId} className="eyebrow mb-2 block">Nom</label>
            <input
              id={nomId}
              type="text"
              value={nom}
              onChange={(e) => touch(setNom)(e.target.value)}
              autoComplete="family-name"
              required
              className={FIELD_CLS}
            />
          </div>

          <div>
            <label htmlFor={telId} className="eyebrow mb-2 block">Téléphone WhatsApp</label>
            <PhoneInputWithCountry
              id={telId}
              value={telephone}
              onChange={(val) => touch(setTelephone)(val)}
            />
          </div>

          <div>
            <label htmlFor={emailId} className="eyebrow mb-2 block">
              Adresse e-mail {isShadowEmail && <span className="text-forest-600 font-semibold text-xs ml-1.5">(Modifiable)</span>}
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => touch(setEmail)(e.target.value)}
              disabled={!isShadowEmail && false}
              autoComplete="email"
              placeholder="votre.email@exemple.com"
              aria-describedby={`${emailId}-hint`}
              className={FIELD_CLS}
            />
            <p id={`${emailId}-hint`} className="mt-1.5 text-xs text-foreground-muted">
              {isShadowEmail
                ? 'Adresse email générée par la conciergerie. Saisissez votre véritable adresse email pour recevoir vos notifications.'
                : 'Votre adresse email associée à votre compte Klef.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-action text-sm disabled:opacity-50"
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
    </section>
  );
}