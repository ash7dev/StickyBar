'use client';

import { useId, useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';

/* ────────────────────────────────────────────────────────────────────────────
   Shared styles
   ──────────────────────────────────────────────────────────────────────────── */

const INPUT_CLS =
  'w-full rounded-xl border bg-white/[0.97] pl-10 pr-3.5 py-3 text-[16px] sm:text-sm font-semibold outline-none transition-all duration-200 placeholder:font-medium [color-scheme:light]';
const PLAIN_INPUT_CLS =
  'w-full rounded-xl border bg-white/[0.97] px-3.5 py-3 text-[16px] sm:text-sm font-semibold outline-none transition-all duration-200 placeholder:font-medium [color-scheme:light]';

function inputStyle(hasError = false) {
  return {
    borderColor: hasError ? 'var(--warning-500)' : 'var(--neutral-200)',
    color: 'var(--forest-950)',
  } as const;
}

const FOCUS_RING =
  'focus:border-forest-700 focus:ring-2 focus:ring-lime-400/30 focus:bg-white';

function looksLikeValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '').replace(/^221/, '');
  return /^7[05678]\d{7}$/.test(digits);
}

/* ────────────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────────────── */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KlefManagedModal({ isOpen, onClose }: ModalProps) {
  const ids = {
    prenom: useId(),
    nom: useId(),
    telephone: useId(),
    email: useId(),
    ville: useId(),
    typeBien: useId(),
    nombreLogements: useId(),
  };

  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState('');
  const [typeBien, setTypeBien] = useState('Appartement');
  const [nombreLogements, setNombreLogements] = useState(1);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phoneTouched = telephone.replace(/\D/g, '').length >= 8;
  const phoneLooksOff = phoneTouched && !looksLikeValidPhone(telephone);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus first field + lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const isSmallScreen = window.matchMedia('(max-width: 639px)').matches;
    const t = !isSmallScreen ? setTimeout(() => firstFieldRef.current?.focus(), 150) : undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      if (t) clearTimeout(t);
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function stepNombreLogements(delta: number) {
    setNombreLogements((prev) => Math.min(50, Math.max(1, prev + delta)));
  }

  function handleNombreLogements(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    setNombreLogements(digits ? Math.min(50, Math.max(1, Number(digits))) : 1);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneLooksOff) {
      setErrorMsg('Merci de vérifier le numéro de téléphone avant de continuer.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      await nestFetch('/api/v1/concierge-leads', {
        method: 'POST',
        body: JSON.stringify({ prenom, nom, telephone, email, ville, typeBien, nombreLogements }),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  function resetAndMaybeClose(close: boolean) {
    setSubmitted(false);
    setPrenom('');
    setNom('');
    setTelephone('');
    setEmail('');
    setVille('');
    setTypeBien('Appartement');
    setNombreLogements(1);
    if (close) onClose();
  }

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[9998] backdrop-blur-sm animate-in fade-in duration-200"
        style={{ background: 'rgba(4, 25, 18, 0.6)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal container ───────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="klef-managed-modal-title"
      >
        <div
          className="relative flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 sm:max-w-xl sm:max-h-[88dvh] sm:rounded-2xl sm:slide-in-from-bottom-4 sm:zoom-in-95"
          style={{
            background: 'var(--neutral-0)',
            border: '1px solid var(--neutral-200)',
            boxShadow: '0 32px 80px rgba(4,25,18,0.2), 0 0 1px rgba(4,25,18,0.08)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grab affordance, mobile only */}
          <div className="flex shrink-0 justify-center pt-2.5 sm:hidden" aria-hidden="true">
            <span className="h-1 w-9 rounded-full" style={{ background: 'var(--neutral-200)' }} />
          </div>

          {/* ════════════════════════════════════════════════════════════════
              HEADER — Dark forest gradient
              ════════════════════════════════════════════════════════════════ */}
          <div
            className="relative shrink-0 overflow-hidden px-6 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6"
            style={{
              background: 'linear-gradient(165deg, var(--forest-900) 0%, var(--forest-950) 100%)',
            }}
          >
            {/* Decorative halo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-20"
              style={{ background: 'var(--lime-400)', filter: 'blur(60px)' }}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full transition-colors cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <X className="h-4 w-4" style={{ color: 'var(--forest-200)' }} />
            </button>

            <div className="relative flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: 'rgba(211,242,110,0.12)',
                  border: '1px solid rgba(211,242,110,0.2)',
                }}
              >
                <Sparkles className="h-6 w-6" style={{ color: 'var(--lime-300)' }} />
              </div>

              <div className="space-y-1.5 pr-8">
                <h2
                  id="klef-managed-modal-title"
                  className="font-display text-lg font-bold tracking-tight sm:text-xl"
                  style={{ color: 'var(--neutral-50)' }}
                >
                  Prise en charge Klef Managed
                </h2>
                <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--forest-200)' }}>
                  Laissez vos coordonnées, notre équipe conciergerie vous recontacte sous 24h.
                </p>
              </div>
            </div>

            {/* Trust badges row */}
            <div className="relative mt-4 flex flex-wrap items-center gap-2">
              {['Sans engagement', 'Gratuit', 'Confidentiel'].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--forest-300)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <CheckCircle2 className="h-2.5 w-2.5" style={{ color: 'var(--lime-400)' }} />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              BODY
              ════════════════════════════════════════════════════════════════ */}
          <div className="overflow-y-auto px-6 sm:px-8">
            {submitted ? (
              /* ── Success state ─────────────────────────────────────────── */
              <div className="my-8 space-y-5 text-center animate-in zoom-in-95 duration-300">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: 'var(--lime-400)',
                    boxShadow: '0 0 60px rgba(211,242,110,0.35), 0 4px 16px rgba(211,242,110,0.2)',
                  }}
                >
                  <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--forest-800)' }} />
                </div>

                <div className="space-y-2">
                  <h3
                    className="font-display text-xl font-bold tracking-tight"
                    style={{ color: 'var(--forest-950)' }}
                  >
                    Demande enregistrée !
                  </h3>
                  <p
                    className="mx-auto max-w-xs text-sm font-medium leading-relaxed"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    Merci <strong style={{ color: 'var(--forest-800)' }}>{prenom} {nom}</strong>.
                    Notre équipe vous contactera très rapidement au{' '}
                    <strong style={{ color: 'var(--forest-800)' }}>{telephone}</strong>.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => resetAndMaybeClose(false)}
                    className="rounded-xl border px-5 py-3 text-xs font-bold transition-colors cursor-pointer sm:py-2.5"
                    style={{
                      borderColor: 'var(--neutral-200)',
                      color: 'var(--forest-800)',
                      background: 'var(--neutral-0)',
                    }}
                  >
                    Soumettre une autre demande
                  </button>
                  <button
                    type="button"
                    onClick={() => resetAndMaybeClose(true)}
                    className="rounded-xl px-5 py-3 text-xs font-bold transition-colors cursor-pointer sm:py-2.5"
                    style={{
                      background: 'var(--forest-900)',
                      color: 'var(--lime-400)',
                    }}
                  >
                    Terminer
                  </button>
                </div>
              </div>
            ) : (
              /* ── Form ──────────────────────────────────────────────────── */
              <form id="klef-managed-form" onSubmit={handleSubmit} className="space-y-6 py-6">
                {errorMsg && (
                  <div
                    role="alert"
                    className="rounded-xl border p-3 text-xs font-semibold"
                    style={{
                      borderColor: 'var(--error-500)',
                      background: 'var(--error-50)',
                      color: 'var(--error-700)',
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                {/* ── Section: Identité & contact ────────────────────────── */}
                <fieldset className="space-y-4">
                  <legend
                    className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <User className="h-3 w-3" style={{ color: 'var(--forest-600)' }} />
                    Vos coordonnées
                  </legend>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={ids.prenom}
                        className="mb-1.5 block text-xs font-bold"
                        style={{ color: 'var(--forest-900)' }}
                      >
                        Prénom <span style={{ color: 'var(--error-500)' }}>*</span>
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--neutral-400)' }} />
                        <input
                          ref={firstFieldRef}
                          id={ids.prenom}
                          type="text"
                          required
                          autoComplete="given-name"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          placeholder="Ex : Moussa"
                          className={`${INPUT_CLS} ${FOCUS_RING}`}
                          style={inputStyle()}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={ids.nom}
                        className="mb-1.5 block text-xs font-bold"
                        style={{ color: 'var(--forest-900)' }}
                      >
                        Nom <span style={{ color: 'var(--error-500)' }}>*</span>
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--neutral-400)' }} />
                        <input
                          id={ids.nom}
                          type="text"
                          required
                          autoComplete="family-name"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          placeholder="Ex : Diallo"
                          className={`${INPUT_CLS} ${FOCUS_RING}`}
                          style={inputStyle()}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={ids.telephone}
                      className="mb-1.5 block text-xs font-bold"
                      style={{ color: 'var(--forest-900)' }}
                    >
                      Téléphone (WhatsApp) <span style={{ color: 'var(--error-500)' }}>*</span>
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--neutral-400)' }} />
                      <input
                        id={ids.telephone}
                        type="tel"
                        required
                        autoComplete="tel"
                        inputMode="tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        placeholder="+221 77 XXX XX XX"
                        aria-invalid={phoneLooksOff}
                        aria-describedby={phoneLooksOff ? `${ids.telephone}-hint` : undefined}
                        className={`${INPUT_CLS} ${FOCUS_RING}`}
                        style={inputStyle(phoneLooksOff)}
                      />
                    </div>
                    {phoneLooksOff && (
                      <p
                        id={`${ids.telephone}-hint`}
                        className="mt-1.5 text-[0.65rem] font-semibold"
                        style={{ color: 'var(--warning-600)' }}
                      >
                        Format sénégalais attendu : 9 chiffres commençant par 70/75/76/77/78.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={ids.email}
                      className="mb-1.5 block text-xs font-bold"
                      style={{ color: 'var(--forest-900)' }}
                    >
                      Email{' '}
                      <span className="font-medium" style={{ color: 'var(--neutral-400)' }}>
                        (optionnel)
                      </span>
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--neutral-400)' }} />
                      <input
                        id={ids.email}
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="moussa@gmail.com"
                        className={`${INPUT_CLS} ${FOCUS_RING}`}
                        style={inputStyle()}
                      />
                    </div>
                  </div>
                </fieldset>

                {/* ── Section: Votre bien ─────────────────────────────────── */}
                <fieldset className="space-y-4">
                  <legend
                    className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-wider mb-3 pt-2"
                    style={{
                      color: 'var(--foreground-muted)',
                      borderTop: '1px solid var(--neutral-200)',
                      paddingTop: '1.25rem',
                      width: '100%',
                    }}
                  >
                    <Building2 className="h-3 w-3" style={{ color: 'var(--forest-600)' }} />
                    Votre bien
                  </legend>

                  <div>
                    <label
                      htmlFor={ids.ville}
                      className="mb-1.5 block text-xs font-bold"
                      style={{ color: 'var(--forest-900)' }}
                    >
                      Ville / zone
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--neutral-400)' }} />
                      <input
                        id={ids.ville}
                        type="text"
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                        placeholder="Almadies, Saly…"
                        className={`${INPUT_CLS} ${FOCUS_RING}`}
                        style={inputStyle()}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label
                        htmlFor={ids.typeBien}
                        className="mb-1.5 block text-xs font-bold"
                        style={{ color: 'var(--forest-900)' }}
                      >
                        Type de bien
                      </label>
                      <select
                        id={ids.typeBien}
                        value={typeBien}
                        onChange={(e) => setTypeBien(e.target.value)}
                        className={`${PLAIN_INPUT_CLS} ${FOCUS_RING} cursor-pointer`}
                        style={inputStyle()}
                      >
                        <option value="Appartement">Appartement</option>
                        <option value="Studio">Studio</option>
                        <option value="Villa">Villa</option>
                        <option value="Chambre">Chambre meublée</option>
                        <option value="Autres">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={ids.nombreLogements}
                        className="mb-1.5 block text-xs font-bold"
                        style={{ color: 'var(--forest-900)' }}
                      >
                        Nb de biens
                      </label>
                      <div
                        className="flex items-stretch overflow-hidden rounded-xl border focus-within:border-forest-700 focus-within:ring-2 focus-within:ring-lime-400/30"
                        style={{ borderColor: 'var(--neutral-200)', background: 'var(--neutral-0)' }}
                      >
                        <button
                          type="button"
                          onClick={() => stepNombreLogements(-1)}
                          disabled={nombreLogements <= 1}
                          aria-label="Diminuer le nombre de biens"
                          className="grid w-11 place-items-center transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-30"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          id={ids.nombreLogements}
                          type="text"
                          inputMode="numeric"
                          value={nombreLogements}
                          onChange={(e) => handleNombreLogements(e.target.value)}
                          className="w-12 border-x text-center text-[16px] sm:text-sm font-bold tabular-nums outline-none [color-scheme:light]"
                          style={{
                            borderColor: 'var(--neutral-200)',
                            color: 'var(--forest-950)',
                            background: 'var(--neutral-0)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => stepNombreLogements(1)}
                          disabled={nombreLogements >= 50}
                          aria-label="Augmenter le nombre de biens"
                          className="grid w-11 place-items-center transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-30"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </form>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              FOOTER — Sticky submit
              ════════════════════════════════════════════════════════════════ */}
          {!submitted && (
            <div
              className="shrink-0 border-t px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-8 sm:pb-5"
              style={{
                borderColor: 'var(--neutral-200)',
                background: 'var(--neutral-50)',
              }}
            >
              <button
                type="submit"
                form="klef-managed-form"
                disabled={loading}
                aria-busy={loading}
                className="group flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: 'var(--lime-400)',
                  color: 'var(--forest-800)',
                  border: '1px solid var(--action-edge)',
                  boxShadow: loading ? 'none' : '0 6px 24px rgba(211,242,110,0.3)',
                }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--forest-900)' }} />
                ) : (
                  <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: 'var(--forest-900)' }} />
                )}
                <span>{loading ? 'Envoi en cours...' : 'Confier mon bien à Klef Managed'}</span>
                {!loading && (
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" style={{ color: 'var(--forest-800)' }} />
                )}
              </button>
              <p
                className="mt-2.5 flex items-center justify-center gap-2 text-center text-[0.6rem] font-medium"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <ShieldCheck className="h-3 w-3 shrink-0" style={{ color: 'var(--forest-600)' }} />
                <span style={{ color: 'var(--error-500)' }}>*</span> Champs obligatoires · Données confidentielles
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}