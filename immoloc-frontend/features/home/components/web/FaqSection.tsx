'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowRight, MessageCircle, Mail } from 'lucide-react';
import Link from 'next/link';

const FAQS = [
  {
    q: 'Comment réserver un logement sur ImmoLoc ?',
    a: 'C\'est simple ! Parcourez les logements disponibles, choisissez vos dates, et cliquez sur "Réserver". Votre paiement est mis en séquestre et vous recevez une confirmation instantanée par SMS et email.',
  },
  {
    q: 'Quels documents sont nécessaires pour louer ?',
    a: 'Une pièce d\'identité valide suffit pour créer votre compte. Pour les réservations longue durée, un justificatif de revenus peut être demandé par le propriétaire.',
  },
  {
    q: 'Puis-je annuler ma réservation ?',
    a: 'Oui. Chaque annonce affiche clairement sa politique d\'annulation. En cas d\'annulation dans les délais, votre séquestre vous est remboursé intégralement.',
  },
  {
    q: 'Comment sont vérifiés les propriétaires ?',
    a: 'Tous les bailleurs passent par un processus KYC obligatoire (pièce d\'identité + validation du logement). Seuls les comptes validés peuvent publier des annonces.',
  },
  {
    q: 'Comment devenir propriétaire sur ImmoLoc ?',
    a: 'Créez un compte, passez le KYC, publiez votre premier logement gratuitement. Nos équipes valident votre annonce sous 24h.',
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section className="bg-background-alt py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[38%_1fr] gap-12 lg:gap-20 items-start">

          {/* ── Left — Sticky sidebar ── */}
          <div className="lg:sticky lg:top-32">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 mb-6">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Questions fréquentes</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-[1.1] mb-4">
              Tout savoir sur{' '}
              <span className="text-emerald-600">ImmoLoc</span>
            </h2>
            <p className="text-foreground-muted text-sm font-medium leading-relaxed mb-10 max-w-sm">
              Vous avez des questions ? Nous avons les réponses. Sinon, notre support est là pour vous.
            </p>

            {/* Contact card — glassmorphism dark */}
            <div className="relative bg-emerald-900 rounded-[2rem] p-8 border border-white/5 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative z-10">
                <p className="text-white font-black text-base mb-1.5">Besoin d&apos;aide directe ?</p>
                <p className="text-white/30 text-xs font-medium mb-6 leading-relaxed">
                  Notre équipe support est disponible 7j/7.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white text-xs font-black rounded-full hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(20,101,76,0.2)] hover:shadow-[0_0_30px_rgba(20,101,76,0.35)]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </Link>
                  <Link
                    href="mailto:support@immoloc.sn"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-background-card/[0.04] border border-white/[0.08] text-white/70 text-xs font-black rounded-full hover:bg-background-card/[0.08] transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right — Accordion ── */}
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={i}
                  className={`
                    rounded-[1.5rem] border overflow-hidden transition-all duration-500
                    ${isOpen
                      ? 'bg-emerald-900 border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.1)]'
                      : 'bg-background-card border-border hover:border-border-hover hover:shadow-sm'}
                  `}
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="w-full flex items-center gap-4 px-7 py-6 text-left"
                  >
                    {/* Number badge */}
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-colors duration-300 ${isOpen ? 'bg-emerald-600 text-white' : 'bg-background-alt text-foreground-muted'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <span className={`flex-1 text-sm font-black leading-snug transition-colors duration-300 ${isOpen ? 'text-white' : 'text-foreground'}`}>
                      {faq.q}
                    </span>

                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-background-card/[0.06] rotate-180' : 'bg-background-alt'}`}>
                      <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? 'text-white/60' : 'text-foreground-muted'}`} />
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-7 pb-7 pl-[4.75rem]">
                        <div className="w-10 h-px bg-emerald-500/20 mb-4" />
                        <p className="text-white/40 text-sm font-medium leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

