'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Camera, CheckCircle2, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { KlefManagedModal } from '@/features/managed/components/KlefManagedModal';

const FEATURES = [
  { icon: Camera, text: 'Photos pro & mise en valeur' },
  { icon: Building2, text: 'Accueil & remise des clés' },
  { icon: ShieldCheck, text: 'États des lieux photos certifiés' },
  { icon: Wallet, text: 'Reversements Wave / OM' },
];

export function KlefManagedHomeBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div
            className="section-inverse relative overflow-hidden border p-6 shadow-lg sm:p-10 md:p-12"
            style={{ borderColor: 'color-mix(in srgb, var(--lime-400) 22%, transparent)' }}
          >
            {/* Halos décoratifs — dans la palette : forest + lime, jamais emerald. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-forest-400/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-lime-400/10 blur-3xl"
            />

            <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              {/* ── Colonne gauche : promesse ──────────────────────────────── */}
              <div className="space-y-5 lg:col-span-7">
                <span className="badge-brand">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Nouveau · Klef Managed
                </span>

                <h2>
                  Pas le temps de gérer vos réservations ?{' '}
                  Confiez-nous les <em className="marker">clés</em>.
                </h2>

                <p className="max-w-xl">
                  Avec notre service de gestion 100% déléguée{' '}
                  <strong className="font-semibold text-on-inverse-display">Klef Managed</strong>,
                  notre équipe s&apos;occupe de tout : séance photo pro, accueil des voyageurs, états
                  des lieux certifiés et reversements automatiques Mobile Money.
                </p>

                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                  {FEATURES.map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-2.5 rounded-inner border border-border-inverse px-3 py-2 text-xs font-semibold text-on-inverse-muted"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-on-inverse-marker" aria-hidden="true" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Colonne droite : carte d'action ────────────────────────── */}
              <div className="flex flex-col items-center justify-center lg:col-span-5 lg:items-end">
                <div className="glass-dark w-full max-w-sm space-y-5 p-6 text-center shadow-xl sm:p-7 sm:text-left">
                  <div className="space-y-1">
                    <span className="eyebrow block text-[0.65rem]">Offre Sérénité Bailleur</span>
                    <h3>0 heure de gestion. 100% de sérénité.</h3>
                    <p className="text-xs">
                      Laissez simplement votre nom et numéro. Notre équipe conciergerie vous
                      recontacte sous 24h.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-action w-full justify-center flex items-center gap-2 cursor-pointer"
                  >
                    <span>Demander une prise en charge</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-center text-xs sm:justify-start">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-on-inverse-marker" aria-hidden="true" />
                    Sans engagement · Réponse sous 24h
                  </p>
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