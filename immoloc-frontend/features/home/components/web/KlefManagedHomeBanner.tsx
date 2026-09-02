'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Key,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { KlefManagedModal } from '@/features/managed/components/KlefManagedModal';

/* ────────────────────────────────────────────────────────────────────────────
   Feature cards data (Left 2×2 grid)
   ──────────────────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Camera,
    title: 'Photos Professionnelles',
    desc: 'Séance photo HD par un agent Klef. Mise en valeur optimale de chaque pièce.',
  },
  {
    icon: Building2,
    title: 'Accueil des Voyageurs',
    desc: `Remise des clés, présentation du logement et check-in d'entrée certifié.`,
  },
  {
    icon: ClipboardCheck,
    title: 'États des Lieux Certifiés',
    desc: `Inspections photographiques d'entrée et de sortie. Preuve en cas de litige.`,
  },
  {
    icon: Wallet,
    title: 'Reversements Wave / OM',
    desc: 'Vos revenus locatifs versés automatiquement sur votre compte mobile money.',
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   Card Highlights (Right column card)
   ──────────────────────────────────────────────────────────────────────────── */

const CARD_HIGHLIGHTS = [
  {
    icon: Key,
    title: 'Prise en charge à 100%',
    desc: 'Clés, ménage, réservations & accueil.',
  },
  {
    icon: ShieldCheck,
    title: 'Protection & Garantie',
    desc: 'États des lieux avec photos d’inspection.',
  },
  {
    icon: Wallet,
    title: 'Revenus automatisés',
    desc: 'Paiements directs via Wave & Orange Money.',
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   Main banner component
   ──────────────────────────────────────────────────────────────────────────── */

export function KlefManagedHomeBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-24">
        {/* ── Organic background blobs ──────────────────────────────────── */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute -right-20 -top-20 h-[420px] w-[420px] rounded-full opacity-[0.07]"
            style={{ background: 'var(--lime-400)', filter: 'blur(80px)' }}
          />
          <div
            className="absolute -bottom-32 -left-16 h-[350px] w-[350px] rounded-full opacity-[0.04]"
            style={{ background: 'var(--forest-600)', filter: 'blur(100px)' }}
          />
          <div
            className="absolute right-1/4 top-1/3 h-[200px] w-[200px] rounded-full opacity-[0.05]"
            style={{ background: 'var(--lime-300)', filter: 'blur(60px)' }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">

          {/* ── Header badge ──────────────────────────────────────────── */}
          <div className="mb-8 sm:mb-12 text-center lg:text-left">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider"
              style={{
                background: 'var(--forest-50)',
                borderColor: 'var(--forest-200)',
                color: 'var(--forest-700)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--lime-600)' }} />
              Nouveau · Klef Managed
            </span>
          </div>

          {/* ── Main grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">

            {/* ════ LEFT COLUMN ═══════════════════════════════════════ */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">

              {/* Headline & Description */}
              <div className="space-y-4">
                <h2
                  className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.025em]"
                  style={{ color: 'var(--forest-950)' }}
                >
                  Pas le temps de gérer{' '}
                  <br className="hidden sm:block" />
                  vos réservations ?{' '}
                  <span className="block mt-1">
                    Confiez-nous les{' '}
                    <em
                      className="not-italic relative inline-block"
                      style={{ color: 'var(--forest-950)' }}
                    >
                      clés
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1 left-0 right-0 h-[0.2em] rounded-full"
                        style={{ background: 'var(--lime-400)' }}
                      />
                    </em>.
                  </span>
                </h2>
                <p
                  className="max-w-xl text-base leading-relaxed sm:text-lg"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Déléguez 100% de la gestion locative de vos biens avec{' '}
                  <strong className="font-semibold" style={{ color: 'var(--forest-800)' }}>
                    Klef Managed
                  </strong>
                  . Nos agents locaux s&apos;occupent de chaque détail sur le terrain pour vous faire
                  gagner du temps et sécuriser vos revenus.
                </p>
              </div>

              {/* Feature cards — 2×2 dark grid */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                  <div
                    key={title}
                    className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(145deg, var(--forest-900) 0%, var(--forest-950) 100%)',
                      borderColor: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Subtle gradient hover overlay */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: 'radial-gradient(circle at 30% 20%, rgba(211,242,110,0.06), transparent 60%)' }}
                    />

                    <div className="relative flex items-start gap-3.5">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: 'rgba(211,242,110,0.1)',
                          border: '1px solid rgba(211,242,110,0.15)',
                        }}
                      >
                        <Icon className="h-[1.125rem] w-[1.125rem]" style={{ color: 'var(--lime-300)' }} />
                      </span>

                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold leading-snug" style={{ color: 'var(--neutral-50)' }}>
                          {title}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--forest-200)' }}>
                          {desc}
                        </p>
                      </div>
                    </div>

                    {/* Step number — subtle watermark */}
                    <span
                      className="absolute bottom-3 right-4 font-mono text-[0.6rem] font-bold tabular-nums"
                      style={{ color: 'rgba(255,255,255,0.08)' }}
                    >
                      0{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ════ RIGHT COLUMN ══════════════════════════════════════ */}
            <div className="lg:col-span-5 flex flex-col justify-end">
              {/* ── Mobile: simple CTA only ────────────────────────────── */}
              <div className="flex flex-col items-center gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="group flex w-full max-w-sm items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold transition-all duration-200 cursor-pointer"
                  style={{
                    background: 'var(--lime-400)',
                    color: 'var(--forest-800)',
                    border: '1px solid var(--action-edge)',
                    boxShadow: '0 6px 24px rgba(211,242,110,0.3)',
                  }}
                >
                  <span>Demander une prise en charge</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <p
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <ShieldCheck className="h-3 w-3 shrink-0" style={{ color: 'var(--forest-600)' }} />
                  Sans engagement · Réponse sous 24h
                </p>
              </div>

              {/* ── Desktop: Premium Concierge Card ───────────────────── */}
              <div
                className="hidden lg:flex relative flex-1 flex-col justify-between overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all"
                style={{
                  background: 'linear-gradient(160deg, var(--forest-900) 0%, var(--forest-950) 100%)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 24px 60px rgba(4,25,18,0.22)',
                }}
              >
                {/* Decorative glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20"
                  style={{ background: 'var(--lime-400)', filter: 'blur(50px)' }}
                />

                {/* Top Section */}
                <div className="relative space-y-6">
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider"
                      style={{
                        background: 'rgba(211,242,110,0.12)',
                        border: '1px solid rgba(211,242,110,0.25)',
                        color: 'var(--lime-300)',
                      }}
                    >
                      <Star className="h-3 w-3 fill-current text-lime-400" />
                      Offre Sérénité Bailleur
                    </span>
                    <span className="text-[0.65rem] font-medium" style={{ color: 'var(--forest-300)' }}>
                      0h de gestion
                    </span>
                  </div>

                  {/* Title & Subtitle inside Card */}
                  <div className="space-y-2">
                    <h3
                      className="font-display text-xl font-bold leading-tight sm:text-2xl"
                      style={{ color: 'var(--neutral-50)' }}
                    >
                      Déléguez en toute sérénité.
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--forest-200)' }}>
                      Maximisez vos revenus locatifs sans contrainte. Notre conciergerie locale prend soin de votre bien de A à Z.
                    </p>
                  </div>

                  {/* Highlights List */}
                  <div className="space-y-3 pt-2">
                    {CARD_HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
                      <div
                        key={title}
                        className="flex items-center gap-3.5 rounded-xl p-3 border transition-colors"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: 'rgba(211,242,110,0.1)',
                            color: 'var(--lime-300)',
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold" style={{ color: 'var(--neutral-50)' }}>
                            {title}
                          </p>
                          <p className="text-[0.68rem]" style={{ color: 'var(--forest-300)' }}>
                            {desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Section — Action CTA */}
                <div className="relative pt-8 space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="group flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold transition-all duration-200 cursor-pointer hover:scale-[1.01]"
                    style={{
                      background: 'var(--lime-400)',
                      color: 'var(--forest-800)',
                      border: '1px solid var(--action-edge)',
                      boxShadow: '0 8px 30px rgba(211,242,110,0.35)',
                    }}
                  >
                    <span>Demander une prise en charge</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  <div className="flex items-center justify-center gap-3 text-[0.65rem] font-medium" style={{ color: 'var(--forest-300)' }}>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" style={{ color: 'var(--lime-400)' }} />
                      Sans engagement
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" style={{ color: 'var(--lime-400)' }} />
                      Réponse sous 24h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal interactif de saisie lead */}
      <KlefManagedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}