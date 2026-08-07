'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';
import {
  AlertCircle, ArrowRight, Building2, CheckCircle2, ChevronDown, Clock,
  Loader2, Mail, MapPin, MessageCircle, Phone, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   ⚠️  À RENSEIGNER AVANT PUBLICATION

   Les delais de reponse affiches sur une page publique sont des engagements.
   Indiquez le pire cas que vous pouvez tenir, pas le meilleur.
   ═══════════════════════════════════════════════════════════════════════════ */

const CONTACT = {
  whatsapp: '221770000000',
  whatsappLabel: '+221 77 000 00 00',
  phone: '+221770000000',
  phoneLabel: '+221 77 000 00 00',
  email: 'contact@klef.sn',
  hours: 'Du lundi au samedi, 9h – 19h',
  replyDelay: '—',        // délai de réponse habituel
  urgentDelay: '—',       // délai sur la ligne urgence
};

const LEGAL_ENTITY = {
  name: 'Klef SARL',
  address: 'Dakar, Sénégal',
  ninea: '—',
  rccm: '—',
};

const SUBJECTS = [
  'Question sur une réservation',
  'Je suis propriétaire',
  'Problème de paiement',
  'Signaler une annonce',
  'Presse ou partenariat',
  'Autre',
] as const;

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactPage() {
  const ids = { nom: useId(), contact: useId(), sujet: useId(), message: useId() };

  const [form, setForm] = useState({ nom: '', contact: '', sujet: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const summaryRef = useRef<HTMLDivElement>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nom.trim()) e.nom = 'Indiquez votre nom.';
    if (!form.contact.trim()) {
      e.contact = 'Indiquez un email ou un numéro pour vous répondre.';
    } else if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(form.contact) && !/^\+?[\d\s]{8,}$/.test(form.contact)) {
      e.contact = 'Format non reconnu. Exemple : nom@exemple.com ou +221 77 123 45 67.';
    }
    if (!form.sujet) e.sujet = 'Choisissez un objet.';
    if (form.message.trim().length < 20) e.message = 'Décrivez votre demande en quelques phrases (20 caractères minimum).';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);

    if (Object.keys(e).length > 0) {
      // Recapitulatif d'erreurs focalise : le motif accessible pour un
      // formulaire. Sans lui, un lecteur d'ecran ne signale rien apres l'envoi
      // et l'utilisateur ne sait pas pourquoi rien ne se passe.
      summaryRef.current?.focus();
      return;
    }

    setStatus('sending');
    try {
      // TODO : brancher sur l'endpoint reel.
      // Prevoir une protection anti-spam cote serveur (Turnstile ou hCaptcha) :
      // un formulaire public sans filtre recoit des dizaines de messages
      // automatises par jour.
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      setForm({ nom: '', contact: '', sujet: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  const field = (hasError: boolean) => cn(
    'w-full rounded-field border bg-background-card px-4 py-3 text-[0.9375rem] text-foreground',
    'placeholder:text-foreground-faint outline-none transition-[border-color,box-shadow] duration-150',
    hasError
      ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/25'
      : 'border-border focus:border-forest-500 focus:ring-2 focus:ring-forest-500/25',
  );

  return (
    <div className="bg-canvas min-h-dvh">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="-mt-20 bg-[radial-gradient(70%_60%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] pb-16 pt-32 text-white sm:pt-36">
        <div className="mx-auto max-w-[1120px] px-6 text-center">
          <h1 className="mx-auto max-w-3xl font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-neutral-50">
            Nous joindre<span className="text-on-inverse-marker">.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest-200 sm:text-lg">
            WhatsApp est le plus rapide. Pour un problème pendant un séjour,
            appelez directement.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] space-y-14 px-6 py-12 lg:py-16">

        {/*
          ── Urgence, en premier ────────────────────────────────────────────
          Quelqu'un debout devant un logement dont il n'a pas les cles n'a pas
          besoin d'un champ « objet ». C'est la situation la plus a risque du
          produit, elle passe donc avant tout le reste.
        */}
        <section className="rounded-card border border-warning-500/30 bg-warning-50 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-warning-500/15 text-warning-700">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-forest-900">
                  Vous êtes sur place et quelque chose ne va pas
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                  Accès impossible, hôte injoignable, logement non conforme.
                  Appelez : nous répondons sous {CONTACT.urgentDelay} et votre
                  paiement reste bloqué le temps qu’on règle la situation.
                </p>
              </div>
            </div>

            <a
              href={`tel:${CONTACT.phone}`}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-pill bg-forest-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-700 sm:self-auto"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {CONTACT.phoneLabel}
            </a>
          </div>
        </section>

        {/* ── Canaux ────────────────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-3">
          {/* WhatsApp est le canal principal au Senegal : il est mis en avant,
              pas noye au milieu de trois options equivalentes. */}
          <a
            href={`https://wa.me/${CONTACT.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-card border border-action/40 bg-lime-50 p-6 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none"
          >
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-inner bg-marker-bg text-forest-800">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-forest-900">
              WhatsApp
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-muted">
              Le plus rapide, et vous gardez l’historique de l’échange.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-800">
              {CONTACT.whatsappLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </a>

          <a
            href={`mailto:${CONTACT.email}`}
            className="flex flex-col rounded-card border border-border bg-background-card p-6 shadow-sm"
          >
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-forest-700">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-forest-900">
              Email
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-muted">
              Pour les demandes détaillées ou avec des pièces à joindre.
            </p>
            <span className="mt-4 break-all text-sm font-medium text-forest-700">
              {CONTACT.email}
            </span>
          </a>

          <div className="flex flex-col rounded-card border border-border bg-background-card p-6 shadow-sm">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-forest-700">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-forest-900">
              Nos horaires
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-muted">
              {CONTACT.hours}
              <br />
              Réponse habituelle sous {CONTACT.replyDelay}.
            </p>
            <p className="mt-4 text-xs text-foreground-faint">
              La ligne urgence reste joignable en dehors de ces horaires.
            </p>
          </div>
        </section>

        {/* ── Litige : orientation vers l'app ─────────────────────────── */}
        {/*
          Un litige ne doit PAS passer par le formulaire : il a besoin de la
          reservation, des dates et des photos. Le parcours in-app porte ce
          contexte, et il gele les fonds. Renvoyer ici evite des echanges
          d'emails inexploitables.
        */}
        <section className="rounded-card border border-border bg-background-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-neutral-100 text-forest-700">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-forest-900">
                  Signaler un problème sur une réservation
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-foreground-muted">
                  Passez par la réservation concernée dans l’application, pas par
                  ce formulaire. Vous pourrez joindre des photos, et le
                  signalement bloque automatiquement le versement à l’hôte le
                  temps de l’examen.
                </p>
              </div>
            </div>
            <Link
              href="/reservations"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-pill border border-border px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100 sm:self-auto"
            >
              Mes réservations
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── Formulaire ───────────────────────────────────────────────── */}
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.02em] text-forest-900">
              Écrire un message
            </h2>
            <p className="mt-2 text-base leading-relaxed text-foreground-muted">
              Pour tout le reste. Réponse sous {CONTACT.replyDelay} en moyenne.
            </p>

            {status === 'sent' ? (
              <div role="status" className="mt-6 flex items-start gap-3 rounded-card bg-success-50 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
                <div>
                  <p className="font-medium text-success-700">Message envoyé.</p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Nous revenons vers vous sous {CONTACT.replyDelay}. Si c’est
                    urgent, appelez plutôt le {CONTACT.phoneLabel}.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                {/* Recapitulatif d'erreurs, focalisable */}
                {Object.keys(errors).length > 0 && (
                  <div
                    ref={summaryRef}
                    tabIndex={-1}
                    role="alert"
                    className="rounded-field border border-error-500/25 bg-error-50 p-4"
                  >
                    <p className="text-sm font-medium text-error-700">
                      Corrigez {Object.keys(errors).length === 1 ? 'le point suivant' : 'les points suivants'} :
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-error-600">
                      {Object.entries(errors).map(([k, v]) => (
                        <li key={k}>
                          <a href={`#${ids[k as keyof typeof ids]}`} className="underline underline-offset-2">
                            {v}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {status === 'error' && (
                  <p role="alert" className="rounded-field bg-error-50 px-4 py-3 text-sm text-error-700">
                    L’envoi a échoué. Réessayez, ou écrivez-nous sur WhatsApp.
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={ids.nom} className="mb-2 block text-sm font-medium text-foreground">
                      Votre nom <span className="text-error-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={ids.nom}
                      value={form.nom}
                      onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                      autoComplete="name"
                      aria-invalid={!!errors.nom}
                      aria-describedby={errors.nom ? `${ids.nom}-err` : undefined}
                      className={field(!!errors.nom)}
                    />
                    {errors.nom && <p id={`${ids.nom}-err`} className="mt-1.5 text-xs text-error-600">{errors.nom}</p>}
                  </div>

                  <div>
                    <label htmlFor={ids.contact} className="mb-2 block text-sm font-medium text-foreground">
                      Email ou téléphone <span className="text-error-600" aria-hidden="true">*</span>
                    </label>
                    {/* Un seul champ pour les deux : imposer l'email exclut
                        les utilisateurs qui n'en consultent pas. */}
                    <input
                      id={ids.contact}
                      value={form.contact}
                      onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                      placeholder="nom@exemple.com ou +221 77 123 45 67"
                      aria-invalid={!!errors.contact}
                      aria-describedby={errors.contact ? `${ids.contact}-err` : undefined}
                      className={field(!!errors.contact)}
                    />
                    {errors.contact && <p id={`${ids.contact}-err`} className="mt-1.5 text-xs text-error-600">{errors.contact}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor={ids.sujet} className="mb-2 block text-sm font-medium text-foreground">
                    Objet <span className="text-error-600" aria-hidden="true">*</span>
                  </label>
                  {/* <select> natif : sur mobile il ouvre le selecteur systeme,
                      plus rapide et plus accessible qu'une liste maison. */}
                  <div className="relative">
                    <select
                      id={ids.sujet}
                      value={form.sujet}
                      onChange={(e) => setForm((f) => ({ ...f, sujet: e.target.value }))}
                      aria-invalid={!!errors.sujet}
                      aria-describedby={errors.sujet ? `${ids.sujet}-err` : undefined}
                      className={cn(field(!!errors.sujet), 'appearance-none pr-11')}
                    >
                      <option value="">Choisissez un objet</option>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" aria-hidden="true" />
                  </div>
                  {errors.sujet && <p id={`${ids.sujet}-err`} className="mt-1.5 text-xs text-error-600">{errors.sujet}</p>}
                </div>

                <div>
                  <label htmlFor={ids.message} className="mb-2 block text-sm font-medium text-foreground">
                    Message <span className="text-error-600" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id={ids.message}
                    rows={6}
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Décrivez votre demande. Si elle concerne un logement, indiquez son nom ou son lien."
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? `${ids.message}-err` : `${ids.message}-count`}
                    className={cn(field(!!errors.message), 'resize-none leading-relaxed')}
                  />
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    {errors.message
                      ? <p id={`${ids.message}-err`} className="text-error-600">{errors.message}</p>
                      : <span className="text-foreground-faint">Plus vous êtes précis, plus la réponse est utile.</span>}
                    <span id={`${ids.message}-count`} className="tabular-nums text-foreground-faint">
                      {form.message.length} / 2000
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-700 disabled:opacity-50 sm:w-auto"
                >
                  {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {status === 'sending' ? 'Envoi…' : 'Envoyer le message'}
                </button>
              </form>
            )}
          </div>

          {/* ── Avant d'écrire ───────────────────────────────────────── */}
          <aside className="space-y-4">
            <div className="rounded-card border border-border bg-background-card p-6 shadow-sm">
              <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-forest-900">
                La réponse est peut-être déjà là
              </h2>
              <ul className="mt-4 space-y-1">
                {[
                  { label: 'Comment fonctionne le séquestre', href: '/paiement' },
                  { label: 'Ce que couvre la Protection Voyageur', href: '/protection' },
                  { label: 'Comment ça marche, étape par étape', href: '/comment-ca-marche' },
                  { label: 'Ressources propriétaires', href: '/ressources' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="-mx-2 flex min-h-10 items-center gap-2 rounded-inner px-2 text-sm text-foreground-muted transition-colors duration-150 hover:bg-background-alt hover:text-forest-700"
                    >
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-foreground-faint" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Identification de la societe : obligatoire, et premier signal
                de credibilite pour une plateforme qui detient des fonds. */}
            <div className="rounded-card border border-border bg-background-card p-6 shadow-sm">
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-inner bg-neutral-100 text-forest-700">
                <Building2 className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
              </span>
              <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-forest-900">
                {LEGAL_ENTITY.name}
              </h2>
              <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-foreground-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-foreground-faint" aria-hidden="true" />
                {LEGAL_ENTITY.address}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-foreground-faint">
                NINEA {LEGAL_ENTITY.ninea} · RCCM {LEGAL_ENTITY.rccm}
              </p>
              <Link
                href="/legal/mentions"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 underline underline-offset-2 hover:text-forest-600"
              >
                Mentions légales
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}