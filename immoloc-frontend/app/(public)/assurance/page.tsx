'use client';

import Link from 'next/link';
import {
  AlertCircle, ArrowRight, Ban, CalendarX, Camera, ChevronDown,
  DoorClosed, FileText, Info, ShieldCheck, Wallet, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   « PROTECTION VOYAGEUR », PAS « ASSURANCE VOYAGEUR »

   Le mot « assurance » est juridiquement protege. Le proposer suppose d'etre
   assureur ou intermediaire enregistre — au Senegal, sous le regime CIMA.

   Airbnb applique exactement cette distinction : sa protection dommages est
   presentee comme « n'etant pas une police d'assurance », tandis que sa
   responsabilite civile, souscrite aupres d'assureurs tiers, est nommee
   « assurance ». Deux produits, deux noms, deux regimes.

   Ce que decrit cette page est une GARANTIE COMMERCIALE financee par Klef.
   Elle est tenable des le lancement, sans assureur, parce que le sequestre
   permet de rembourser : les fonds sont deja entre nos mains.

   Si tu ajoutes plus tard une vraie assurance via un partenaire (NSIA, Sunu,
   Allianz Senegal...), elle fera l'objet d'une SECTION SEPAREE, nommee
   « assurance », avec le nom de l'assureur et le numero de police.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ⚠️  À RENSEIGNER — chaque valeur devient un engagement opposable. */
const PROTECTION = {
  /** Délai pour signaler un problème après l'arrivée. */
  reportWindow: '—',
  /** Délai de remboursement après validation du signalement. */
  refundDelay: '—',
  /** Plafond de prise en charge des frais de relogement, s'il existe. */
  rehousingCap: '—',
} as const;

const COVERED = [
  {
    icon: DoorClosed,
    title: 'Vous ne pouvez pas entrer',
    body: 'L’hôte est injoignable, les clés ne sont pas disponibles, l’accès est impossible : remboursement intégral, et nous cherchons un logement équivalent aux mêmes dates.',
  },
  {
    icon: XCircle,
    title: 'Le logement ne correspond pas',
    body: 'Photos trompeuses, équipement annoncé absent, nombre de chambres inexact, logement insalubre : remboursement intégral après examen de vos éléments.',
  },
  {
    icon: CalendarX,
    title: 'L’hôte annule au dernier moment',
    body: `Remboursement intégral sans condition, plus la prise en charge d’un relogement équivalent jusqu’à ${PROTECTION.rehousingCap} si vous êtes déjà sur place.`,
  },
  {
    icon: Wallet,
    title: 'Votre argent n’est jamais exposé',
    body: 'Le paiement reste sous séquestre jusqu’à la remise des clés. C’est ce mécanisme qui rend cette protection possible : les fonds sont encore entre nos mains.',
  },
] as const;

/*
  Les exclusions ne sont pas une precaution juridique : c'est ce qui rend la
  page credible. Une garantie sans exclusion n'est pas lue comme genereuse,
  elle est lue comme fausse. La page AirCover d'Airbnb est majoritairement
  composee d'exclusions.
*/
const EXCLUDED = [
  'Vol, perte ou dégradation de vos effets personnels pendant le séjour',
  'Dommages corporels, frais médicaux, rapatriement',
  'Annulation de votre part pour raison personnelle, hors délai gratuit',
  'Désagréments subjectifs : bruit du quartier, goût de la décoration, météo',
  'Dommages que vous causez au logement, qui restent à votre charge',
  'Paiement effectué en dehors de Klef, en espèces ou par transfert direct',
] as const;

const CLAIM_STEPS = [
  {
    icon: Camera,
    title: 'Documentez',
    body: 'Photos ou vidéos datées, dès la constatation. C’est la pièce la plus déterminante du dossier.',
  },
  {
    icon: AlertCircle,
    title: 'Signalez',
    body: `Depuis la réservation dans l’application, sous ${PROTECTION.reportWindow} après l’arrivée. Les fonds restent bloqués pendant l’examen.`,
  },
  {
    icon: FileText,
    title: 'Nous examinons',
    body: 'Vos éléments, ceux de l’hôte, et le rapport de visite de l’agent Klef. Décision motivée par écrit.',
  },
  {
    icon: ShieldCheck,
    title: 'Nous remboursons',
    body: `Sous ${PROTECTION.refundDelay} après validation, sur le compte Wave ou Orange Money utilisé au paiement.`,
  },
] as const;

const FAQ = [
  {
    q: 'La Protection Voyageur est-elle une assurance ?',
    a: 'Non. C’est une garantie commerciale accordée par Klef, financée par Klef, et régie par nos conditions générales. Elle n’est pas souscrite auprès d’un assureur et ne remplace pas une assurance voyage. Pour vos effets personnels, votre santé ou votre responsabilité civile, souscrivez un contrat auprès d’un assureur.',
  },
  {
    q: 'Faut-il payer un supplément ?',
    a: 'Non. La protection s’applique automatiquement à toute réservation payée via Klef, sans option à cocher ni frais additionnel. Elle cesse en revanche de s’appliquer si vous payez l’hôte directement.',
  },
  {
    q: 'Et si l’hôte conteste ma demande ?',
    a: 'Les deux versions sont examinées. Le rapport de visite de l’agent Klef, réalisé avant la mise en ligne, sert de référence sur l’état et la conformité du logement. En l’absence d’accord, les voies de recours de droit commun sénégalais restent ouvertes.',
  },
  {
    q: 'Que se passe-t-il si je signale trop tard ?',
    a: `Passé ${PROTECTION.reportWindow} après l’arrivée, les fonds sont versés à l’hôte et la protection ne peut plus jouer. Signalez dès la constatation, même si vous n’êtes pas encore sûr de vouloir annuler.`,
  },
] as const;

export default function ProtectionVoyageurPage() {
  return (
    <div className="bg-canvas min-h-dvh">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="-mt-20 bg-[radial-gradient(70%_60%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] pb-16 pt-32 text-white sm:pt-36">
        <div className="mx-auto max-w-[1120px] px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.06] px-4 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-forest-200">
              Protection Voyageur
            </span>
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-neutral-50">
            Si le logement n’est pas au rendez-vous<span className="text-lime-400">.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest-200 sm:text-lg">
            Vous êtes remboursé. Pas parce que nous vous le promettons, mais
            parce que votre argent est encore entre nos mains au moment où vous
            arrivez.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] space-y-16 px-6 py-12 lg:py-16">

        {/* ── Ce qui est couvert ────────────────────────────────────────── */}
        <section className="space-y-8">
          <header className="space-y-3">
            <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-[-0.02em] text-forest-900">
              Ce qui est couvert
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-foreground-muted">
              Quatre situations, toutes liées au logement et à l’accès. Elles
              couvrent l’essentiel de ce qui peut mal se passer à l’arrivée.
            </p>
          </header>

          <ul className="grid gap-4 md:grid-cols-2">
            {COVERED.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className={cn(
                  'flex items-start gap-4 rounded-card border p-5',
                  // La derniere carte explique le mecanisme qui rend les trois
                  // premieres possibles : elle est mise en avant.
                  i === COVERED.length - 1
                    ? 'border-lime-400/40 bg-lime-50'
                    : 'border-border bg-background-card shadow-sm',
                )}
              >
                <span className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-inner',
                  i === COVERED.length - 1
                    ? 'bg-lime-400/25 text-forest-800'
                    : 'bg-neutral-100 text-forest-700',
                )}>
                  <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-forest-900">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Ce qui n'est pas couvert ─────────────────────────────────── */}
        <section className="rounded-card border border-border bg-background-card p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-neutral-100 text-foreground-muted">
              <Ban className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
                Ce qui n’est pas couvert
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                Dire clairement où s’arrête la protection vaut mieux que laisser
                croire qu’elle couvre tout.
              </p>

              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {EXCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground-muted">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-foreground-faint" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Comment signaler ─────────────────────────────────────────── */}
        <section className="space-y-8">
          <header className="space-y-3">
            <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-[-0.02em] text-forest-900">
              Comment faire jouer la protection
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-foreground-muted">
              Quatre étapes, et un seul délai à retenir&nbsp;: {PROTECTION.reportWindow} après votre arrivée.
            </p>
          </header>

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CLAIM_STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex flex-col rounded-card border border-border bg-background-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-neutral-100 text-forest-700">
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-sm tabular-nums text-forest-500" aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold leading-snug tracking-[-0.01em] text-forest-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Démenti : ce n'est pas une assurance ─────────────────────── */}
        {/*
          Bloc obligatoire, et non negociable.

          « Assurance » est un terme reglemente. Cette page decrit une garantie
          commerciale financee par Klef. Le dire explicitement protege
          l'entreprise ET informe correctement l'utilisateur, qui doit savoir
          qu'il n'est couvert ni pour ses effets personnels ni pour sa sante.
        */}
        <section className="rounded-card border border-warning-500/30 bg-warning-50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-warning-500/15 text-warning-700">
              <Info className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
                La Protection Voyageur n’est pas une assurance
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                Il s’agit d’une garantie commerciale accordée par Klef, financée
                par Klef, et régie par nos{' '}
                <Link href="/legal/cgu" className="font-medium text-forest-700 underline underline-offset-2 hover:text-forest-600">
                  conditions générales
                </Link>. Elle n’est souscrite auprès d’aucun assureur et Klef
                n’est ni assureur ni intermédiaire d’assurance.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                Elle ne remplace pas une assurance voyage. Pour vos effets
                personnels, vos frais de santé ou votre responsabilité civile
                pendant le séjour, souscrivez un contrat auprès d’un assureur.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-[-0.02em] text-forest-900">
            Questions fréquentes
          </h2>

          {/* details/summary natifs : ouverture fonctionnelle avant
              hydratation, clavier et lecteurs d'ecran geres par le navigateur,
              et Ctrl+F trouve le texte des reponses fermees. */}
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-background-card">
            {FAQ.map(({ q, a }) => (
              <li key={q}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left font-medium text-forest-900 transition-colors duration-150 hover:bg-background-alt [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-foreground-muted">
                    {a}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="rounded-card bg-[radial-gradient(70%_55%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] p-8 text-center text-white sm:p-12">
          <h2 className="mx-auto max-w-xl font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-neutral-50">
            Réservez sans avance perdue.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-forest-200">
            La protection s’applique automatiquement, sans option ni supplément.
          </p>
          <Link
            href="/explorer"
            className="mt-8 inline-flex items-center gap-2 rounded-pill bg-lime-400 px-7 py-3.5 text-base font-semibold text-forest-800 transition-colors duration-150 hover:bg-lime-300"
          >
            Voir les logements vérifiés
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-xs text-forest-200/70">
            Voir aussi{' '}
            <Link href="/paiement" className="underline underline-offset-2 hover:text-lime-400">
              comment fonctionne le séquestre
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
