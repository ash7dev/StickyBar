'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Home,
  IdCard,
  KeyRound,
  Loader2,
  Plus,
} from 'lucide-react';
import { useBecomeHost } from '../hooks/use-become-host';
import { RevenueEstimator } from './RevenueEstimator';
import { ManagedCallbackForm } from './ManagedCallbackForm';

// Même numéro que la page Contact
const WHATSAPP_URL = `https://wa.me/221338001234?text=${encodeURIComponent('Bonjour Paixi, j’ai une question sur la location de mon bien.')}`;

const GUARANTEES = [
  { title: 'Identité vérifiée', text: 'CNI ou passeport et selfie, avant toute réservation.' },
  { title: 'Paiement bloqué chez Paixi', text: 'Vous savez qu’il a payé, il sait qu’il trouvera le logement.' },
  { title: 'État des lieux en photos', text: 'Photos datées à l’entrée et à la sortie : votre preuve en cas de dégât.' },
  { title: 'Versé dès son arrivée', text: 'Sur Wave ou Orange Money, sans attendre la fin du séjour.' },
];

const STAY_EVENTS = [
  { icon: CalendarDays, title: 'Nouvelle réservation · 3 nuits', text: 'Le paiement du voyageur est bloqué chez Paixi.' },
  { icon: IdCard, title: 'Identité vérifiée', text: 'Passeport et selfie contrôlés par Paixi.' },
  { icon: Camera, title: 'État des lieux d’entrée', text: 'Photos datées, validées par le voyageur dans l’app.' },
];

const COMPARE: Array<[string, string, string]> = [
  ['Annonce et photos', 'Vous', 'Le gestionnaire'],
  ['Accueil des voyageurs', 'Vous', 'Le gestionnaire'],
  ['États des lieux', 'Vous, dans l’app', 'Le gestionnaire'],
  ['Commission sur votre prix', '0 % · les frais de service sont payés par le voyageur', 'Aucune'],
  ['Versement', 'Dès l’arrivée du voyageur', 'Dès l’arrivée, à vous ou à un proche'],
];

const FAQ = [
  { q: 'Combien ça coûte ?', a: 'La publication est gratuite et vous recevez le prix que vous fixez : les frais de service Paixi sont ajoutés au prix payé par le voyageur. Avec Paixi Managed, aucune commission non plus.' },
  { q: 'Quand suis-je payé ?', a: 'Dès l’arrivée du voyageur dans votre logement, sur Wave, Orange Money ou par virement.' },
  { q: 'Comment les voyageurs sont-ils vérifiés ?', a: 'Avec une pièce d’identité (CNI ou passeport) et un selfie, contrôlés par Paixi avant toute réservation.' },
  { q: 'Et s’il y a des dégâts ?', a: 'Les photos de l’état des lieux d’entrée et de sortie servent de preuve. Vous signalez le problème dans l’app et Paixi traite le litige.' },
  { q: 'J’habite à l’étranger, c’est possible ?', a: 'Oui, c’est exactement pour ça que Paixi Managed existe : un gestionnaire s’occupe de tout sur place, et vos versements peuvent aller sur le numéro d’un proche.' },
];

function Tick({ className = 'text-lime-400' }: { className?: string }) {
  return <Check className={`h-4 w-4 shrink-0 ${className}`} strokeWidth={2.8} aria-hidden="true" />;
}

/** Page d'acquisition des propriétaires : calculateur, deux façons de louer, garanties, Paixi Managed. */
export function OwnersLanding() {
  const { start, loading } = useBecomeHost();

  const publishButton = (className: string, label = 'Publier mon logement') => (
    <button type="button" onClick={start} disabled={loading} className={className}>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
      {label}
    </button>
  );

  return (
    <div className="bg-background pb-24 md:pb-0">
      {/* ── 1. Promesse + calculateur ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest-950 text-neutral-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-64 -top-96 h-[56rem] w-[56rem] rounded-full bg-[radial-gradient(closest-side,rgba(211,242,110,0.14),transparent)]"
        />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-16 pt-12 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-20 lg:pt-16">
          <div className="flex flex-col gap-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-400">Propriétaires · Dakar, Petite Côte, Saint-Louis</p>
            <h1 className="text-[2.75rem] leading-none text-neutral-50 sm:text-6xl lg:text-[5.25rem]">
              Louez votre bien.
              <br />
              <em className="font-medium text-lime-400">À votre façon.</em>
            </h1>
            <p className="max-w-[32rem] text-base leading-relaxed text-forest-200 sm:text-lg">
              Des voyageurs vérifiés, un paiement bloqué à la réservation et versé sur Wave ou Orange Money dès leur
              arrivée. Vous gérez, ou Paixi gère pour vous.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#portes" className="btn-action">
                Commencer
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-pill border border-white/30 px-7 py-3.5 font-semibold text-neutral-50 transition-colors hover:border-white/60"
              >
                Écrire sur WhatsApp
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2.5 text-sm font-semibold text-forest-100">
              <li className="flex items-center gap-2"><Tick />Publication gratuite</li>
              <li className="flex items-center gap-2"><Tick />100 % de votre prix</li>
              <li className="flex items-center gap-2"><Tick />Payé dès l’arrivée</li>
            </ul>
          </div>
          <RevenueEstimator />
        </div>

        {/* ── 2. Les deux portes ─────────────────────────────────────────── */}
        <div id="portes" className="relative mx-auto flex max-w-[1240px] scroll-mt-24 flex-col gap-7 px-4 pb-20 sm:px-8 lg:pb-28">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-white/10 pt-12">
            <h2 className="text-3xl text-neutral-50 sm:text-5xl">Puis choisissez qui s’en occupe.</h2>
            <p className="text-[15px] text-forest-200">Les mêmes garanties dans les deux cas.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <article className="flex flex-col gap-5 rounded-[2rem] bg-neutral-50 p-7 text-forest-950 sm:p-10">
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-50 text-forest-600">
                  <KeyRound className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-xs font-bold tracking-[0.12em] text-neutral-600">GRATUIT</span>
              </div>
              <h3 className="text-[2rem] leading-tight text-forest-950 sm:text-[2.5rem]">Je gère moi-même</h3>
              <p className="text-base leading-relaxed text-neutral-600">Vous habitez sur place. Vous publiez, vous accueillez, vous êtes payé.</p>
              <ul className="flex flex-col gap-2.5 font-medium">
                <li className="flex items-start gap-3"><Tick className="mt-1 text-forest-600" />Compte en 2 minutes avec votre numéro</li>
                <li className="flex items-start gap-3"><Tick className="mt-1 text-forest-600" />100 % de votre prix pour vous</li>
              </ul>
              <button
                type="button"
                onClick={start}
                disabled={loading}
                className="mt-auto flex items-center justify-between border-t border-neutral-200 pt-5 text-left text-[17px] font-semibold disabled:opacity-60"
              >
                Publier mon logement
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-950 text-lime-400">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
                </span>
              </button>
            </article>

            <article className="flex flex-col gap-5 rounded-[2rem] bg-lime-400 p-7 text-forest-950 sm:p-10">
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-950 text-lime-400">
                  <Home className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-xs font-bold tracking-[0.12em] text-forest-800">SANS COMMISSION</span>
              </div>
              <h3 className="text-[2rem] leading-tight text-forest-950 sm:text-[2.5rem]">Paixi gère pour moi</h3>
              <p className="text-base leading-relaxed text-forest-800">Vous êtes loin ou très pris. Un gestionnaire Paixi s’occupe de tout, sur place.</p>
              <ul className="flex flex-col gap-2.5 font-medium">
                <li className="flex items-start gap-3"><Tick className="mt-1 text-forest-950" />Annonce, accueil, états des lieux</li>
                <li className="flex items-start gap-3"><Tick className="mt-1 text-forest-950" />Versements possibles sur le numéro d’un proche</li>
              </ul>
              <a href="#rappel" className="mt-auto flex items-center justify-between border-t border-forest-950/20 pt-5 text-[17px] font-semibold">
                Être rappelé par un gestionnaire
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-950 text-lime-400">
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* ── 3. Garanties + fil d'un séjour ──────────────────────────────── */}
      <section id="garanties" className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <div>
          <p className="eyebrow">Louer sans inquiétude</p>
          <h2 className="mb-6 mt-3 text-[2rem] sm:text-5xl">
            Le voyageur entre. <em className="font-medium text-forest-600">Vous êtes payé.</em>
          </h2>
          <ol>
            {GUARANTEES.map((g, i) => (
              <li key={g.title} className={`flex gap-5 border-t border-border py-5 ${i === GUARANTEES.length - 1 ? 'border-b' : ''}`}>
                <span className={`w-10 font-display text-3xl leading-none ${i === GUARANTEES.length - 1 ? 'text-forest-600' : 'text-neutral-400'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-xl">{g.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-foreground-muted">{g.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-2.5 rounded-[2.25rem] bg-forest-50 p-4 sm:p-7 dark:bg-forest-900">
          <p className="mb-1 ml-1 text-[13px] font-semibold text-forest-700 dark:text-forest-200">Un séjour à Saly, vu par le propriétaire</p>
          {STAY_EVENTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3.5 rounded-2xl border border-border bg-background-card p-4">
              <span className="marker-box h-10 w-10 shrink-0"><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
              <div>
                <p className="text-[15px] font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-[13px] text-foreground-muted">{text}</p>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-3.5 rounded-2xl bg-forest-950 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-forest-950">
              <Check className="h-[18px] w-[18px]" strokeWidth={2.8} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-neutral-50">Voyageur arrivé · versement envoyé</p>
              <p className="mt-0.5 text-[13px] text-forest-200">Sur votre Wave ou votre Orange Money</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Paixi Managed : versement à un proche + rappel ──────────── */}
      <section id="rappel" className="scroll-mt-20 bg-forest-800 text-neutral-50">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="flex flex-col gap-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-400">Paixi Managed · sans commission</p>
            <h2 className="text-[2rem] text-neutral-50 sm:text-5xl">Vous êtes loin ? Votre bien travaille quand même.</h2>
            <p className="text-base leading-relaxed text-forest-200 sm:text-lg">
              Un gestionnaire visite votre bien, crée l’annonce, accueille chaque voyageur et fait les états des lieux.
              Vous suivez tout depuis votre téléphone.
            </p>
            <div className="flex max-w-md flex-col gap-2.5 rounded-3xl bg-forest-950 p-5">
              <p className="text-xs font-semibold tracking-[0.1em] text-forest-300">VERSEMENT À UN PROCHE</p>
              <p className="text-[15px] leading-relaxed text-neutral-100">
                Vos revenus peuvent être versés sur votre numéro ou sur celui d’un proche au Sénégal.
              </p>
              <p className="text-[13px] leading-relaxed text-forest-200">
                Chaque versement est tracé : qui l’a demandé, vers quel numéro, quand. Vous êtes prévenu à chaque fois.
              </p>
            </div>
          </div>
          <ManagedCallbackForm />
        </div>
      </section>

      {/* ── 5. Qui fait quoi ────────────────────────────────────────────── */}
      <section className="border-b border-border bg-background-card">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-8 px-4 py-20 sm:px-8 lg:py-24">
          <h2 className="text-3xl sm:text-[2.75rem]">Qui fait quoi ?</h2>
          <div className="overflow-x-auto rounded-3xl border border-border">
            <table className="w-full min-w-[600px] border-collapse text-left text-[15px]">
              <thead>
                <tr>
                  <th scope="col" className="p-5"><span className="sr-only">Sujet</span></th>
                  <th scope="col" className="p-5 font-semibold">Je gère moi-même</th>
                  <th scope="col" className="bg-lime-50 p-5 font-semibold dark:bg-forest-900">Paixi Managed</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, self, managed]) => (
                  <tr key={label} className="border-t border-border align-top">
                    <th scope="row" className="p-5 font-semibold">{label}</th>
                    <td className="p-5 text-foreground-muted">{self}</td>
                    <td className="bg-lime-50 p-5 text-foreground-muted dark:bg-forest-900">{managed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 6. Questions ────────────────────────────────────────────────── */}
      <section id="questions" className="mx-auto grid max-w-[1240px] gap-10 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <div className="flex flex-col gap-4">
          <h2 className="text-[2rem] sm:text-5xl">Vos questions</h2>
          <p className="text-foreground-muted">
            Une autre question ?{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="font-semibold text-link hover:text-link-hover">
              Écrivez-nous sur WhatsApp
            </a>
            .
          </p>
        </div>
        <div className="border-b border-border">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0} className="group border-t border-border py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus className="h-5 w-5 shrink-0 text-forest-600 transition-transform group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="mt-3 leading-relaxed text-foreground-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── 7. Appel final ──────────────────────────────────────────────── */}
      <section className="bg-forest-950 text-neutral-50">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-8 px-4 py-20 sm:px-8">
          <h2 className="max-w-2xl text-[2rem] leading-tight text-neutral-50 sm:text-[3.5rem]">
            Votre prochain voyageur paie <em className="font-medium text-lime-400">avant</em> d’arriver.
          </h2>
          <div className="flex flex-wrap gap-3">
            {publishButton('btn-action')}
            <Link href="#rappel" className="inline-flex items-center justify-center rounded-pill border border-white/30 px-7 py-3.5 font-semibold text-neutral-50 transition-colors hover:border-white/60">
              Paixi gère pour moi
            </Link>
          </div>
        </div>
      </section>

      {/* Barre d'action fixe sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-white/10 bg-forest-950/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 backdrop-blur md:hidden">
        {publishButton('btn-action flex-1 !px-3', 'Publier')}
        <a href="#rappel" className="flex flex-1 items-center justify-center rounded-pill border border-white/30 py-3.5 font-semibold text-neutral-50">
          Paixi gère
        </a>
      </div>
    </div>
  );
}
