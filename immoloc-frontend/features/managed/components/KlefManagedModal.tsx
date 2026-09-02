'use client';

import { useId, useState, useEffect, useRef } from 'react';
import {
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Minus,
  Phone,
  Plus,
  Send,
  User,
  X,
} from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';

const LABEL_CLS = 'block text-xs font-bold text-slate-800 mb-1.5';
const INPUT_CLS =
  'w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3.5 py-3 text-[16px] sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:bg-white focus:border-forest-800 focus:ring-2 focus:ring-lime-400/40 [color-scheme:light]';
const PLAIN_INPUT_CLS =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-[16px] sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:bg-white focus:border-forest-800 focus:ring-2 focus:ring-lime-400/40 [color-scheme:light]';

function looksLikeValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '').replace(/^221/, '');
  return /^7[05678]\d{7}$/.test(digits);
}

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

  // Focus the first field when the modal opens, and lock page scroll.
  // Skip autofocus on small screens: it pops the mobile keyboard open
  // immediately, which fights the entrance animation and hides the header.
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
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container — bottom sheet on mobile, centered dialog from sm up */}
      <div
        className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="klef-managed-modal-title"
      >
        <div
          className="relative flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl animate-in slide-in-from-bottom duration-300 sm:max-w-xl sm:max-h-[88dvh] sm:rounded-2xl sm:slide-in-from-bottom-4 sm:zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grab affordance, mobile only — purely visual echo of the sheet's edge */}
          <div className="flex shrink-0 justify-center pt-2.5 sm:hidden" aria-hidden="true">
            <span className="h-1 w-9 rounded-full bg-slate-200" />
          </div>

          {/* Close button — 44px touch target */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Header */}
          <div className="shrink-0 space-y-1.5 px-6 pt-5 pb-4 text-center sm:px-8 sm:pt-7">
            <div className="icon-tile mx-auto h-11 w-11 rounded-xl shadow-2xs">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2
              id="klef-managed-modal-title"
              className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
            >
              Demander une prise en charge Klef Managed
            </h2>
            <p className="mx-auto max-w-sm text-xs font-medium text-slate-600">
              Laissez vos coordonnées, notre équipe conciergerie vous recontacte sous 24h.
            </p>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto px-6 sm:px-8">
            {submitted ? (
              <div className="mb-6 space-y-4 rounded-xl border border-forest-200 bg-forest-50 p-6 text-center animate-in zoom-in-95 duration-200">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-forest-900 text-lime-400 shadow-xs">
                  <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Demande enregistrée !</h3>
                  <p className="mx-auto max-w-xs text-xs font-medium leading-relaxed text-slate-700">
                    Merci {prenom} {nom}. Notre équipe vous contactera très rapidement au{' '}
                    <strong className="font-bold text-slate-900">{telephone}</strong>.
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => resetAndMaybeClose(false)}
                    className="rounded-full border border-forest-200 bg-white px-5 py-3 text-xs font-bold text-forest-900 transition-colors hover:bg-forest-100 cursor-pointer sm:py-2.5"
                  >
                    Soumettre une autre demande
                  </button>
                  <button
                    type="button"
                    onClick={() => resetAndMaybeClose(true)}
                    className="rounded-full bg-forest-900 px-5 py-3 text-xs font-bold text-lime-400 transition-colors hover:bg-forest-800 cursor-pointer sm:py-2.5"
                  >
                    Terminer
                  </button>
                </div>
              </div>
            ) : (
              <form id="klef-managed-form" onSubmit={handleSubmit} className="space-y-5 pb-6">
                {errorMsg && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"
                  >
                    {errorMsg}
                  </div>
                )}

                {/* Section: identité + contact */}
                <fieldset className="space-y-3.5">
                  <legend className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Vos coordonnées
                  </legend>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label htmlFor={ids.prenom} className={LABEL_CLS}>
                        Prénom <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={firstFieldRef}
                          id={ids.prenom}
                          type="text"
                          required
                          autoComplete="given-name"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          placeholder="Ex : Moussa"
                          className={INPUT_CLS}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={ids.nom} className={LABEL_CLS}>
                        Nom <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id={ids.nom}
                          type="text"
                          required
                          autoComplete="family-name"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          placeholder="Ex : Diallo"
                          className={INPUT_CLS}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor={ids.telephone} className={LABEL_CLS}>
                      Téléphone (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                        className={`${INPUT_CLS} ${phoneLooksOff ? '!border-amber-400 focus:!border-amber-500 focus:!ring-amber-500/20' : ''
                          }`}
                      />
                    </div>
                    {phoneLooksOff && (
                      <p id={`${ids.telephone}-hint`} className="mt-1.5 text-xs font-semibold text-amber-600">
                        Format sénégalais attendu : 9 chiffres commençant par 70/75/76/77/78.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={ids.email} className={LABEL_CLS}>
                      Email <span className="font-medium text-slate-400">(optionnel)</span>
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id={ids.email}
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="moussa@gmail.com"
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Section: bien à confier */}
                <fieldset className="space-y-3.5 border-t border-slate-100 pt-4">
                  <legend className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Votre bien
                  </legend>

                  <div>
                    <label htmlFor={ids.ville} className={LABEL_CLS}>
                      Ville / zone
                    </label>
                    <input
                      id={ids.ville}
                      type="text"
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      placeholder="Almadies, Saly…"
                      className={PLAIN_INPUT_CLS}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label htmlFor={ids.typeBien} className={LABEL_CLS}>
                        Type de bien
                      </label>
                      <select
                        id={ids.typeBien}
                        value={typeBien}
                        onChange={(e) => setTypeBien(e.target.value)}
                        className={`${PLAIN_INPUT_CLS} cursor-pointer`}
                      >
                        <option value="Appartement" className="bg-white text-slate-900">Appartement</option>
                        <option value="Studio" className="bg-white text-slate-900">Studio</option>
                        <option value="Villa" className="bg-white text-slate-900">Villa</option>
                        <option value="Chambre" className="bg-white text-slate-900">Chambre meublée</option>
                        <option value="Autres" className="bg-white text-slate-900">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={ids.nombreLogements} className={LABEL_CLS}>
                        Nb de biens
                      </label>
                      <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-300 bg-slate-50 focus-within:border-forest-800 focus-within:ring-2 focus-within:ring-lime-400/40">
                        <button
                          type="button"
                          onClick={() => stepNombreLogements(-1)}
                          disabled={nombreLogements <= 1}
                          aria-label="Diminuer le nombre de biens"
                          className="grid w-11 place-items-center text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <input
                          id={ids.nombreLogements}
                          type="text"
                          inputMode="numeric"
                          value={nombreLogements}
                          onChange={(e) => handleNombreLogements(e.target.value)}
                          className="w-12 border-x border-slate-300 bg-white text-center text-[16px] sm:text-sm font-bold tabular-nums text-slate-900 outline-none [color-scheme:light]"
                        />
                        <button
                          type="button"
                          onClick={() => stepNombreLogements(1)}
                          disabled={nombreLogements >= 50}
                          aria-label="Augmenter le nombre de biens"
                          className="grid w-11 place-items-center text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </form>
            )}
          </div>

          {/* Sticky footer with submit — only while the form is showing */}
          {!submitted && (
            <div className="shrink-0 border-t border-slate-100 bg-white px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-8 sm:pb-4">
              <button
                type="submit"
                form="klef-managed-form"
                disabled={loading}
                aria-busy={loading}
                className="btn-action flex w-full items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-md transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-forest-950" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4 text-forest-950" aria-hidden="true" />
                )}
                <span>{loading ? 'Envoi en cours...' : 'Confier mon bien à Klef Managed'}</span>
              </button>
              <p className="mt-2 text-center text-[0.65rem] font-medium text-slate-400">
                <span className="text-rose-500">*</span> Champs obligatoires
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}