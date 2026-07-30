'use client';

import Link from 'next/link';
import {
  AlertCircle, ArrowRight, Ban, Building2, CalendarX, CheckCircle2,
  ChevronDown, Key, Lock, ShieldCheck, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   ⚠️  À RENSEIGNER AVANT PUBLICATION

   Detenir les fonds d'un tiers est une activite reglementee dans l'UEMOA.
   Cette page transforme votre montage en engagement public ecrit : chaque
   valeur ci-dessous doit correspondre a la realite contractuelle, pas a une
   intention.

   Si le montage n'est pas encore arrete, publiez la page SANS le bloc
   « Qui detient l'argent » plutot qu'avec une reponse approximative.
   ═══════════════════════════════════════════════════════════════════════════ */

const ESCROW = {
  /** Etablissement ou compte qui conserve les fonds pendant le sequestre. */
  custodian: '—',
  /** Delai de versement a l'hote apres confirmation de la remise des cles. */
  payoutDelay: '—',
  /** Delai de remboursement au voyageur en cas de bien non conforme. */
  refundDelay: '—',
  /** Fenetre pendant laquelle le voyageur peut signaler une non-conformite. */
  disputeWindow: '—',
  /** Annulation sans frais jusqu'a X heures avant l'arrivee. */
  freeCancelHours: '—',
} as const;

const CHAIN = [
  {
    icon: Wallet,
    title: 'Vous payez',
    money: 'Le montant quitte votre compte',
    detail: 'Par Wave ou Orange Money, au moment de la réservation.',
    isKey: false,
  },
  {
    icon: Lock,
    title: 'Klef bloque',
    money: 'Les fonds sont immobilisés',
    detail: 'Le propriétaire est informé de la réservation, mais ne reçoit rien.',
    isKey: false,
  },
  {
    icon: Key,
    title: 'Vous recevez les clés',
    money: 'Vous confirmez dans l’application',
    detail: 'C’est ce geste, et lui seul, qui déclenche la suite.',
    isKey: true,
  },
  {
    icon: CheckCircle2,
    title: 'Klef verse',
    money: 'Le propriétaire est payé',
    detail: `Versement sous ${ESCROW.payoutDelay} après votre confirmation.`,
    isKey: false,
  },
] as const;

const CASES = [
  {
    icon: AlertCircle,
    title: 'Le logement ne correspond pas',
    body: `Vous avez ${ESCROW.disputeWindow} après votre arrivée pour le signaler depuis l’application, photos à l’appui. Les fonds restent bloqués pendant l’examen. Si la non-conformité est établie, vous êtes remboursé sous ${ESCROW.refundDelay}.`,
    tone: 'alert',
  },
  {
    icon: CalendarX,
    title: 'Vous annulez',
    body: `Annulation sans frais jusqu’à ${ESCROW.freeCancelHours} avant l’arrivée : remboursement intégral. Passé ce délai, les conditions de l’hôte s’appliquent — elles sont affichées sur chaque annonce avant paiement.`,
    tone: 'neutral',
  },
  {
    icon: Ban,
    title: 'L’hôte annule',
    body: 'Remboursement intégral, sans condition ni délai de carence. Nous vous proposons également des logements équivalents aux mêmes dates lorsque c’est possible.',
    tone: 'neutral',
  },
] as const;

const FAQ = [
  {
    q: 'Klef peut-il utiliser mon argent pendant le séquestre ?',
    a: `Non. Les fonds sont conservés séparément des comptes d’exploitation de Klef, chez ${ESCROW.custodian}. Ils ne peuvent servir ni à financer l’activité, ni à payer une autre réservation.`,
  },
  {
    q: 'Que se passe-t-il si je ne confirme jamais la remise des clés ?',
    a: `Passé ${ESCROW.disputeWindow} après la date d’arrivée sans confirmation ni signalement de votre part, la réservation est considérée comme honorée et les fonds sont versés à l’hôte. Vous recevez un rappel avant cette échéance.`,
  },
  {
    q: 'Le propriétaire peut-il me demander un paiement en dehors de Klef ?',
    a: 'Non, et c’est un motif de suspension immédiate du compte. Un paiement en espèces ou par transfert direct sort du séquestre : vous perdez toute protection et Klef ne peut plus intervenir. Signalez-nous toute demande de ce type.',
  },
  {
    q: 'Qui arbitre en cas de désaccord ?',
    a: 'Un membre de l’équipe Klef examine les éléments fournis par les deux parties — photos, échanges, rapport de visite de l’agent. La décision et son motif vous sont communiqués par écrit. À défaut d’accord, les voies de recours de droit commun sénégalais restent ouvertes.',
  },
  {
    q: 'Y a-t-il des frais sur le séquestre ?',
    a: 'Aucun frais supplémentaire pour le voyageur : le montant affiché à la réservation est celui que vous payez. La commission de Klef est prélevée sur le versement à l’hôte.',
  },
] as const;

export default function SequestrePage() {
  return (
    <div className="bg-canvas min-h-dvh">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="-mt-20 bg-[radial-gradient(70%_60%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] pb-16 pt-32 text-white sm:pt-36">
        <div className="mx-auto max-w-[1120px] px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.06] px-4 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-forest-200">
              Séquestre Klef
            </span>
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-neutral-50">
            Comment votre argent est protégé<span className="text-lime-400">.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest-200 sm:text-lg">
            Vous payez à la réservation, mais le propriétaire n’est payé qu’après
            la remise des clés. Voilà exactement ce qui se passe entre les deux.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] space-y-16 px-6 py-12 lg:py-16">

        {/* ── La chaîne ─────────────────────────────────────────────────── */}
        <section className="space-y-8">
          <header className="space-y-3">
            <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-[-0.02em] text-forest-900">
              Où est l’argent, à chaque instant
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-foreground-muted">
              Quatre états, un seul déclencheur. Vous êtes le seul à pouvoir
              faire passer les fonds de l’étape 3 à l’étape 4.
            </p>
          </header>

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CHAIN.map(({ icon: Icon, title, money, detail, isKey }, i) => (
              <li
                key={title}
                className={cn(
                  'flex flex-col rounded-card p-5',
                  isKey
                    // Une seule etape est inversee : la seule ou l'utilisateur
                    // agit, et celle que le nom du produit designe.
                    ? 'bg-[linear-gradient(180deg,#072A20_0%,#041912_100%)] text-white'
                    : 'border border-border bg-background-card shadow-sm',
                )}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-inner',
                    isKey ? 'bg-lime-400/15 text-lime-400' : 'bg-neutral-100 text-forest-700',
                  )}>
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                  </span>
                  <span
                    className={cn('font-mono text-sm tabular-nums', isKey ? 'text-forest-300' : 'text-forest-500')}
                    aria-hidden="true"
                  >
                    0{i + 1}
                  </span>
                </div>

                <h3 className={cn(
                  'font-display text-base font-semibold leading-snug tracking-[-0.01em]',
                  isKey ? 'text-neutral-50' : 'text-forest-900',
                )}>
                  {title}
                </h3>

                {/* L'etat de l'argent, mis en avant : c'est la seule
                    information que le lecteur vient chercher. */}
                <p className={cn(
                  'mt-2 text-sm font-medium',
                  isKey ? 'text-lime-400' : 'text-forest-700',
                )}>
                  {money}
                </p>

                <p className={cn(
                  'mt-1.5 text-sm leading-relaxed',
                  isKey ? 'text-forest-200' : 'text-foreground-muted',
                )}>
                  {detail}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Qui détient l'argent ──────────────────────────────────────── */}
        {/* Bloc a supprimer entierement si le montage n'est pas arrete : une
            reponse approximative sur ce point est pire que pas de reponse. */}
        <section className="rounded-card border border-border bg-background-card p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-lime-400/25 text-forest-800">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
                Qui détient l’argent pendant le séquestre
              </h2>
              <p className="mt-3 text-base leading-relaxed text-foreground-muted">
                Les fonds sont conservés chez{' '}
                <strong className="font-semibold text-forest-900">{ESCROW.custodian}</strong>,
                sur un compte distinct des comptes d’exploitation de Klef. Ils ne
                peuvent être utilisés ni pour financer l’activité de la
                plateforme, ni pour couvrir une autre réservation.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                Klef n’est ni une banque ni un établissement de crédit. Nous
                organisons la conservation et la libération des fonds pour le
                compte des deux parties, selon les règles décrites sur cette page
                et dans nos{' '}
                <Link href="/legal/cgu" className="font-medium text-forest-700 underline underline-offset-2 hover:text-forest-600">
                  conditions générales
                </Link>.
              </p>
            </div>
          </div>
        </section>

        {/* ── Cas particuliers ──────────────────────────────────────────── */}
        <section className="space-y-8">
          <header className="space-y-3">
            <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-[-0.02em] text-forest-900">
              Si quelque chose ne va pas
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-foreground-muted">
              Les trois situations qui déclenchent un remboursement, et ce qui se
              passe dans chacune.
            </p>
          </header>

          <ul className="grid gap-4 md:grid-cols-3">
            {CASES.map(({ icon: Icon, title, body, tone }) => (
              <li
                key={title}
                className={cn(
                  'flex flex-col rounded-card border p-5',
                  tone === 'alert'
                    ? 'border-warning-500/30 bg-warning-50'
                    : 'border-border bg-background-card shadow-sm',
                )}
              >
                <span className={cn(
                  'mb-4 grid h-10 w-10 shrink-0 place-items-center rounded-inner',
                  tone === 'alert' ? 'bg-warning-500/15 text-warning-700' : 'bg-neutral-100 text-forest-700',
                )}>
                  <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                </span>
                <h3 className="font-display text-base font-semibold leading-snug tracking-[-0.01em] text-forest-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-[-0.02em] text-forest-900">
            Questions fréquentes
          </h2>

          {/*
            <details> / <summary> natifs plutot qu'un accordeon en JavaScript.
            Trois avantages concrets : l'ouverture fonctionne avant meme
            l'hydratation, le clavier et les lecteurs d'ecran sont geres par le
            navigateur, et la recherche interne du navigateur (Ctrl+F) trouve
            le texte des reponses fermees.
          */}
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
            Vous savez maintenant où va votre argent.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-forest-200">
            Il ne reste plus qu’à choisir le logement.
          </p>
          <Link
            href="/explorer"
            className="mt-8 inline-flex items-center gap-2 rounded-pill bg-lime-400 px-7 py-3.5 text-base font-semibold text-forest-800 transition-colors duration-150 hover:bg-lime-300"
          >
            Voir les logements vérifiés
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-xs text-forest-200/70">
            Aucun frais tant que vous n’avez pas les clés.
          </p>
        </section>
      </div>
    </div>
  );
}
