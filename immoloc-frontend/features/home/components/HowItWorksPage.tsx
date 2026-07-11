'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, CalendarCheck2, ShieldCheck, Home,
  CheckCircle2, Wallet, Lock, ArrowRight, ChevronDown,
  Star, MessageCircle, Mail, Users, LayoutDashboard,
  Headphones, Zap, CreditCard, FileCheck, BadgeCheck,
  ClipboardList, Banknote, HelpCircle, Building2, User,
  TrendingUp,
} from 'lucide-react';
import { BRAND } from '@/lib/config';

/* ─── Data ─────────────────────────────────────────────────────────────── */
const TENANT_STEPS = [
  {
    id: '01', icon: Search, title: 'Cherchez', tag: 'Filtres intelligents', color: 'emerald' as const,
    desc: "Explorez des centaines de logements vérifiés avec des photos réelles, des descriptions précises et les avis d'autres locataires.",
    details: ['Filtrez par ville, prix, capacité, type de logement', 'Photos réelles prises par notre équipe', 'Carte interactive pour visualiser les quartiers', 'Disponibilités en temps réel'],
  },
  {
    id: '02', icon: CalendarCheck2, title: 'Réservez', tag: 'Paiement sécurisé', color: 'amber' as const,
    desc: "Payez en toute sécurité via Wave, Orange Money ou Carte bancaire. Votre argent est placé en séquestre jusqu'à votre arrivée.",
    details: ['Wave, Orange Money, Visa, Mastercard acceptés', 'Confirmation instantanée par SMS & email', 'Séquestre protège votre paiement à 100 %', "Annulation flexible selon la politique de l'annonce"],
  },
  {
    id: '03', icon: ShieldCheck, title: 'Séjournez', tag: 'Support garanti', color: 'emerald' as const,
    desc: "Le propriétaire vous accueille. Profitez de votre séjour sereinement, avec notre équipe support disponible 7j/7.",
    details: ['Remise des clés coordonnée avec le propriétaire', 'Support WhatsApp & téléphone 24/7', 'État des lieux numérique à l\'entrée et à la sortie', 'Fonds débloqués au propriétaire après confirmation'],
  },
];

const COLOR = {
  emerald: { grid: 'var(--emerald-500)', glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/18', iconBg: 'bg-emerald-500/10 border-emerald-400/20 group-hover:bg-emerald-500/20', iconText: 'text-emerald-400', numBg: 'bg-emerald-500', tagText: 'text-emerald-400', bullet: 'bg-emerald-400', liseré: 'bg-emerald-500 shadow-[0_0_12px_var(--emerald-500)]' },
  amber: { grid: 'var(--amber-500)', glow: 'bg-amber-400/8 group-hover:bg-amber-400/15', iconBg: 'bg-amber-400/10 border-amber-400/20 group-hover:bg-amber-400/20', iconText: 'text-amber-400', numBg: 'bg-amber-500', tagText: 'text-amber-400', bullet: 'bg-amber-400', liseré: 'bg-amber-400 shadow-[0_0_12px_var(--amber-500)]' },
  primary: { grid: 'var(--primary-500)', glow: 'bg-primary-400/6 group-hover:bg-primary-400/14', iconBg: 'bg-primary-400/10 border-primary-400/20 group-hover:bg-primary-400/20', iconText: 'text-primary-400', numBg: 'bg-primary-500', tagText: 'text-primary-400', bullet: 'bg-primary-400', liseré: 'bg-primary-500 shadow-[0_0_12px_var(--primary-500)]' },
};

const TRUST_FEATURES = [
  { icon: FileCheck, title: 'Annonces vérifiées', desc: 'Chaque logement est inspecté avant publication. Photos réelles garanties.', span: 4, dark: true, accent: { bg: 'bg-emerald-500/10', border: 'border-emerald-400/20', text: 'text-emerald-400', glow: 'bg-emerald-500/8', gridColor: 'var(--emerald-500)', hoverShadow: 'hover:shadow-[0_20px_60px_var(--emerald-500)]' } },
  { icon: BadgeCheck, title: 'KYC obligatoire', desc: "Propriétaires et locataires vérifiés par pièce d'identité officielle.", span: 2, dark: false, accent: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-500', glow: 'bg-emerald-400/8', gridColor: '', hoverShadow: 'hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)]' } },
  { icon: Headphones, title: 'Support 7j/7', desc: 'WhatsApp et téléphone, à tout moment.', span: 2, dark: false, accent: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-500', glow: 'bg-violet-400/8', gridColor: '', hoverShadow: 'hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)]' } },
  { icon: Lock, title: 'Séquestre garanti', desc: 'Votre argent est bloqué jusqu\'à la confirmation du séjour. Aucun risque.', span: 4, dark: true, accent: { bg: 'bg-amber-400/10', border: 'border-amber-400/20', text: 'text-amber-400', glow: 'bg-amber-400/8', gridColor: 'var(--amber-500)', hoverShadow: 'hover:shadow-[0_20px_60px_var(--amber-500)]' } },
  { icon: Star, title: 'Avis certifiés', desc: 'Seuls les locataires ayant séjourné peuvent laisser un avis. 100 % authentiques.', span: 3, dark: false, accent: { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-500', glow: 'bg-sky-400/8', gridColor: '', hoverShadow: 'hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)]' } },
  { icon: Users, title: 'Médiation impartiale', desc: 'En cas de litige, notre équipe tranche de manière neutre et rapide.', span: 3, dark: false, accent: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-500', glow: 'bg-amber-400/8', gridColor: '', hoverShadow: 'hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)]' } },
];

const ESCROW_STEPS = [
  { label: 'Locataire paie', sub: 'Wave / OM / Carte', icon: CreditCard, bg: 'bg-emerald-500/10', border: 'border-emerald-400/20', text: 'text-emerald-400', num: 'bg-emerald-500' },
  { label: 'Séquestre bloqué', sub: 'Chez ImmoLoc', icon: Lock, bg: 'bg-amber-500/10', border: 'border-amber-400/20', text: 'text-amber-400', num: 'bg-amber-500' },
  { label: 'Séjour confirmé', sub: 'Check-in validé', icon: CheckCircle2, bg: 'bg-emerald-500/10', border: 'border-emerald-400/20', text: 'text-emerald-400', num: 'bg-emerald-500' },
  { label: 'Propriétaire payé', sub: 'Sous 48 h', icon: Banknote, bg: 'bg-violet-500/10', border: 'border-violet-400/20', text: 'text-violet-400', num: 'bg-violet-500' },
];

const FAQS = [
  { q: "Qu'est-ce que le séquestre et pourquoi c'est important ?", a: "Le séquestre est un mécanisme de protection financière : votre paiement est bloqué chez ImmoLoc dès la réservation, et n'est libéré au propriétaire qu'une fois votre arrivée confirmée. Si le logement ne correspond pas à l'annonce, vous êtes remboursé." },
  { q: 'Quels moyens de paiement sont acceptés ?', a: 'Nous acceptons Wave, Orange Money, Visa et Mastercard. Tous les paiements sont sécurisés et cryptés. Aucune information bancaire n\'est stockée sur nos serveurs.' },
  { q: 'Comment se passe la vérification KYC ?', a: "La vérification KYC consiste à uploader une photo de votre pièce d'identité valide (CNI, passeport ou titre de séjour). Notre équipe valide le document sous 24 h. Cette étape est obligatoire pour tous les propriétaires." },
  { q: 'Que se passe-t-il si je dois annuler ma réservation ?', a: "Chaque annonce affiche clairement sa politique d'annulation (Flexible, Modérée ou Stricte). En cas d'annulation dans les délais prévus, votre séquestre est remboursé intégralement. Passé ce délai, des frais peuvent s'appliquer." },
  { q: 'Comment le propriétaire reçoit-il son argent ?', a: "Une fois votre check-in confirmé par les deux parties, le montant est libéré et viré sur le compte Wave, Orange Money ou bancaire du propriétaire sous 48 h ouvrées." },
  { q: "Y a-t-il des frais de service ?", a: "ImmoLoc facture 8 % de frais de service au locataire et 5 % au propriétaire. Ces frais couvrent le séquestre, la vérification des annonces, le support 24/7 et la médiation en cas de litige." },
];

/* ─── Components ────────────────────────────────────────────────────────── */
function StepCard({ step, index, total }: { step: typeof TENANT_STEPS[0]; index: number; total: number }) {
  const c = COLOR[step.color];
  const Icon = step.icon;
  return (
    <div className="relative z-10 group">
      <div className={`relative bg-emerald-800 border border-white/5 rounded-[2rem] p-8 sm:p-10 transition-all duration-500 hover:border-white/10 hover:-translate-y-1.5 hover:shadow-[0_24px_80px_rgba(0,0,0,0.3)] overflow-hidden`}>
        {/* Ambient glow — appears on hover */}
        <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[80px] pointer-events-none transition-colors duration-700 ${c.glow}`} />
        {/* Colored grid */}
        <div className="absolute inset-0 opacity-[0.04] rounded-[2rem]" style={{ backgroundImage: `linear-gradient(${c.grid} 0.5px, transparent 0.5px), linear-gradient(90deg, ${c.grid} 0.5px, transparent 0.5px)`, backgroundSize: '28px 28px' }} />
        {/* Watermark number */}
        <span className="absolute -bottom-6 -right-3 text-[120px] font-black leading-none select-none" style={{ color: c.grid, opacity: 0.04 }}>{step.id}</span>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className={`w-10 h-10 rounded-full ${c.numBg} flex items-center justify-center shadow-lg`}>
              <span className="text-xs font-black text-white">{step.id}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${c.tagText}`}>{step.tag}</span>
            </div>
          </div>

          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-8 transition-all duration-500 ${c.iconBg}`}>
            <Icon className={`w-7 h-7 ${c.iconText}`} />
          </div>

          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{step.title}</h3>
          <p className="text-white/35 text-sm font-medium leading-relaxed mb-7">{step.desc}</p>

          <ul className="space-y-2.5">
            {step.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${c.bullet} mt-1.5 flex-shrink-0`} />
                <span className="text-white/30 text-xs font-medium leading-relaxed">{d}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Animated bottom liseré */}
        <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 rounded-b-[2rem] ${c.liseré}`} />
      </div>
      {index < total - 1 && (
        <div className="md:hidden flex justify-center py-4">
          <div className="w-px h-8 bg-gradient-to-b from-white/10 to-transparent" />
        </div>
      )}
    </div>
  );
}

export function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div className="bg-emerald-800 min-h-screen">

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <section className="relative pt-16 lg:pt-20 pb-12 lg:pb-16 overflow-hidden rounded-b-[4rem] lg:rounded-b-[5rem]">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-emerald-800 to-emerald-900/30 rounded-b-[4rem] lg:rounded-b-[5rem]" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-br from-emerald-500/15 via-emerald-600/10 to-transparent blur-[180px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-gradient-to-tr from-emerald-500/10 via-emerald-500/8 to-transparent blur-[160px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-400/5 blur-[200px] rounded-full pointer-events-none" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Gradient ring effect */}
        <div className="absolute inset-0 rounded-b-[4rem] lg:rounded-b-[5rem] bg-gradient-to-b from-white/5 via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-6 text-center z-10">
          {/* Breadcrumb with glassmorphism */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg mb-8">
            <Link href="/" className="text-xs font-medium text-white/40 hover:text-white/80 transition-colors">Accueil</Link>
            <span className="text-white/20">/</span>
            <span className="text-xs font-medium text-white/60">Comment ça marche</span>
          </div>

          {/* Premium badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-emerald-400/20 to-emerald-500/20 backdrop-blur-xl border border-emerald-400/30 shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-8">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.25em]">Guide ImmoLoc</span>
          </div>

          {/* Premium heading with gradient text */}
          <div className="relative mb-6">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white/95 to-white/70 tracking-tighter leading-[0.95] mb-3">
              Comment ça
            </h1>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 tracking-tighter leading-[0.95]">
              marche
            </h1>
            {/* Glow effect behind text */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10" />
          </div>
          
          <p className="text-base lg:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed font-medium mb-10">
            De la recherche au paiement, découvrez comment {BRAND.name} sécurise chaque étape pour locataires et propriétaires.
          </p>

          {/* Premium trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            {[
              { icon: ShieldCheck, text: 'Séquestre 100% garanti', color: 'from-emerald-400/20 to-emerald-500/20', iconColor: 'text-emerald-400', border: 'border-emerald-400/30' },
              { icon: BadgeCheck, text: 'Propriétaires KYC', color: 'from-emerald-400/20 to-emerald-500/20', iconColor: 'text-emerald-400', border: 'border-emerald-400/30' },
              { icon: Star, text: 'Note 4.8/5', color: 'from-amber-400/20 to-amber-500/20', iconColor: 'text-amber-400', border: 'border-amber-400/30' },
            ].map(({ icon: Icon, text, color, iconColor, border }, i) => (
              <div key={i} className="flex items-center gap-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center border ${border}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <span className="text-sm font-bold text-white/90">{text}</span>
              </div>
            ))}
          </div>

          {/* Premium quick nav */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: 'Locataires', href: '#locataires' },
              { label: 'Propriétaires', href: '#proprietaires' },
              { label: 'Séquestre', href: '#sequestre' },
              { label: 'Garanties', href: '#garanties' },
              { label: 'FAQ', href: '#faq' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white/50 text-xs font-black hover:bg-white/10 hover:border-white/20 hover:text-white/90 hover:shadow-lg transition-all duration-300"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LOCATAIRES ══════════════════════════════════════════════════ */}
      <section id="locataires" className="bg-background-card py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-emerald-800 overflow-hidden rounded-[3rem] py-20 px-8 sm:px-12 lg:px-16">
            <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-emerald-500/6 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-emerald-500/4 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="relative z-10">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] mb-6">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.25em]">Pour les locataires</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  Trouvez et réservez{' '}
                  <span className="text-emerald-400">en 3 étapes</span>
                </h2>
                <p className="text-white/30 text-sm font-medium mt-4 max-w-xl mx-auto leading-relaxed">
                  Cherchez le logement idéal, payez en sécurité et séjournez l&apos;esprit tranquille.
                </p>
              </div>

              <div className="relative grid md:grid-cols-3 gap-6 lg:gap-8">
                {/* Desktop connector */}
                <div className="hidden md:block absolute top-[7.5rem] left-[16.66%] right-[16.66%] h-px z-0">
                  <div className="w-full h-full bg-gradient-to-r from-emerald-500/30 via-amber-400/30 to-emerald-400/30" />
                </div>
                {TENANT_STEPS.map((step, i) => (
                  <StepCard key={step.id} step={step} index={i} total={TENANT_STEPS.length} />
                ))}
              </div>

              <div className="text-center mt-14">
                <Link
                  href="/logements"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-emerald-500 text-white text-sm font-black rounded-full hover:bg-emerald-400 transition-all duration-300 shadow-[0_0_30px_var(--emerald-500)] hover:shadow-[0_0_50px_var(--emerald-500)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explorer les logements <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROPRIÉTAIRES ═══════════════════════════════════════════════ */}
      <section id="proprietaires" className="bg-background-card pt-4 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">

            {/* ── Bloc 1 : Publiez ── */}
            <div className="group relative bg-emerald-800 p-10 sm:p-12 overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.01] rounded-[2rem]">
              <div className="absolute -top-20 -left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none transition-colors duration-700 group-hover:bg-violet-500/18" />
              <div className="absolute inset-0 opacity-[0.04] rounded-[2rem]" style={{ backgroundImage: 'linear-gradient(var(--violet-500) 0.5px, transparent 0.5px), linear-gradient(90deg, var(--violet-500) 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
              <span className="absolute -bottom-8 -right-4 text-[160px] font-black leading-none select-none" style={{ color: 'var(--violet-500)', opacity: 0.05 }}>01</span>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full mb-8">
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.25em]">Étape 01</span>
                </div>
                <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-7 border border-violet-400/20 transition-colors group-hover:bg-violet-500/20">
                  <ClipboardList className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight mb-3">Publiez</h3>
                <p className="text-white/40 text-sm font-medium mb-6 max-w-sm leading-relaxed">Créez votre annonce en 5 minutes. Notre équipe valide et publie votre logement sous 24 h.</p>
                <ul className="space-y-2 mb-8">
                  {['Formulaire guidé étape par étape', 'Gestion des photos par catégorie', 'Tarification flexible', 'Validation par notre équipe sous 24 h'].map((d, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                      <span className="text-white/30 text-xs font-medium">{d}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm group-hover:gap-4 transition-all duration-300">
                  Commencer <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-violet-500 shadow-[0_0_12px_var(--violet-500)] group-hover:w-full transition-all duration-700 rounded-b-[2rem]" />
            </div>

            {/* ── Bloc 2 : Confirmez ── */}
            <div className="group relative bg-emerald-800 p-10 sm:p-12 overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.01] rounded-[2rem]">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-400/8 rounded-full blur-[80px] pointer-events-none transition-colors duration-700 group-hover:bg-sky-400/15" />
              <div className="absolute inset-0 opacity-[0.04] rounded-[2rem]" style={{ backgroundImage: 'linear-gradient(var(--sky-400) 0.5px, transparent 0.5px), linear-gradient(90deg, var(--sky-400) 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
              <span className="absolute -bottom-8 -right-4 text-[160px] font-black leading-none select-none" style={{ color: 'var(--sky-400)', opacity: 0.05 }}>02</span>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full mb-8">
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.25em]">Étape 02</span>
                </div>
                <div className="w-14 h-14 bg-sky-400/10 rounded-2xl flex items-center justify-center mb-7 border border-sky-400/20 transition-colors group-hover:bg-sky-400/20">
                  <BadgeCheck className="w-7 h-7 text-sky-400" />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight mb-3">Confirmez</h3>
                <p className="text-white/40 text-sm font-medium mb-6 max-w-sm leading-relaxed">Recevez les demandes en temps réel. Acceptez ou déclinez en un clic depuis votre dashboard.</p>
                <ul className="space-y-2 mb-8">
                  {['Notifications instantanées de demande', 'Accepter ou décliner en un clic', "KYC pièce d'identité pour chaque locataire", 'Messagerie directe avec le futur locataire'].map((d, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                      <span className="text-white/30 text-xs font-medium">{d}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm group-hover:gap-4 transition-all duration-300">
                  Voir le dashboard <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-sky-400 shadow-[0_0_12px_var(--sky-400)] group-hover:w-full transition-all duration-700 rounded-b-[2rem]" />
            </div>

            {/* ── Bloc 3 : Encaissez + stat centrale ── */}
            <div className="md:col-span-2 group relative bg-surface-dark p-10 sm:p-12 overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.005] rounded-[2rem]">
              <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-emerald-500/6 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-[400px] h-[250px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <span className="absolute -bottom-8 -right-4 text-[160px] font-black leading-none select-none" style={{ color: 'var(--emerald-500)', opacity: 0.04 }}>03</span>

              <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full mb-8">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.25em]">Étape 03</span>
                  </div>
                  <div className="w-14 h-14 bg-emerald-400/10 rounded-2xl flex items-center justify-center mb-7 border border-emerald-400/20 transition-colors group-hover:bg-emerald-400/20">
                    <Banknote className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight mb-3">Encaissez</h3>
                  <p className="text-white/40 text-sm font-medium mb-6 max-w-sm leading-relaxed">Le montant est libéré automatiquement après confirmation du check-in. Virement sous 48 h.</p>
                  <ul className="space-y-2 mb-8">
                    {['Libération automatique à la confirmation', 'Virement Wave, Orange Money ou bancaire', 'Dashboard revenus & statistiques', 'Historique complet des paiements'].map((d, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="text-white/30 text-xs font-medium">{d}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/become-host" className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-emerald-500 text-white text-sm font-black rounded-full hover:bg-emerald-400 transition-all duration-300 shadow-[0_0_25px_var(--emerald-500)] hover:shadow-[0_0_40px_var(--emerald-500)] hover:scale-[1.02]">
                    Devenir hôte <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Stat panel */}
                <div className="flex flex-col items-center text-center">
                  <div className="text-8xl lg:text-9xl font-black text-emerald-400 tracking-tighter mb-3">+30%</div>
                  <p className="text-white/25 text-sm font-medium max-w-[200px] leading-relaxed mb-10">de revenus supplémentaires en moyenne pour nos hôtes</p>
                  <div className="grid grid-cols-3 gap-6 w-full max-w-xs border-t border-white/[0.06] pt-8">
                    {[{ v: '500+', l: 'Hôtes actifs' }, { v: '4.8★', l: 'Note moy.' }, { v: '48h', l: '1ère résa' }].map((s, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg font-black text-white">{s.v}</div>
                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-emerald-400 shadow-[0_0_12px_var(--emerald-500)] group-hover:w-full transition-all duration-700 rounded-b-[2rem]" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ SÉQUESTRE ═══════════════════════════════════════════════════ */}
      <section id="sequestre" className="bg-background-card py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-emerald-800 overflow-hidden rounded-[3rem] py-20 px-8 sm:px-12 lg:px-16">
            <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-amber-400/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-emerald-500/4 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="relative z-10 max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] mb-6">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-[0.25em]">Sécurité financière</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  Le séquestre,{' '}
                  <span className="text-amber-400">votre garantie</span>
                </h2>
                <p className="text-white/30 text-sm font-medium mt-4 max-w-xl mx-auto leading-relaxed">Un mécanisme transparent qui protège locataires et propriétaires à chaque transaction.</p>
              </div>

              {/* Flow cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {ESCROW_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="group relative bg-background-card/[0.02] border border-white/[0.06] rounded-[1.75rem] p-6 flex flex-col items-center text-center transition-all duration-500 hover:bg-background-card/[0.05] hover:border-white/[0.10] hover:-translate-y-1 overflow-hidden">
                      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${step.bg}`} />
                      <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${step.bg} ${step.border}`}>
                          <Icon className={`w-6 h-6 ${step.text}`} />
                        </div>
                        <div className={`w-6 h-6 rounded-full ${step.num} flex items-center justify-center mb-3`}>
                          <span className="text-[9px] font-black text-white">{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        <h4 className="text-sm font-black text-white mb-1">{step.label}</h4>
                        <p className="text-white/30 text-[11px] font-medium">{step.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info grid */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="group relative bg-background-card/[0.02] border border-white/[0.06] rounded-2xl p-7 overflow-hidden hover:border-white/[0.10] transition-all duration-500">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/6 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-4">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="text-base font-black text-white mb-2">Pour le locataire</h4>
                    <p className="text-white/35 text-sm font-medium leading-relaxed">Si le logement ne correspond pas à l&apos;annonce, signalez-le dans les 2 heures. Notre équipe examine le cas et vous rembourse intégralement si le litige est validé.</p>
                  </div>
                </div>
                <div className="group relative bg-background-card/[0.02] border border-white/[0.06] rounded-2xl p-7 overflow-hidden hover:border-white/[0.10] transition-all duration-500">
                  <div className="absolute -top-12 -left-12 w-40 h-40 bg-emerald-400/6 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-4">
                      <Banknote className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="text-base font-black text-white mb-2">Pour le propriétaire</h4>
                    <p className="text-white/35 text-sm font-medium leading-relaxed">Dès que le locataire confirme son arrivée, le montant est libéré et viré sur votre compte Wave ou bancaire sous 48 h ouvrées.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ GARANTIES (bento) ═══════════════════════════════════════════ */}
      <section id="garanties" className="bg-neutral-50 py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 mb-5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Nos engagements</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
              La sécurité,{' '}
              <span className="text-emerald-500">à chaque étape</span>
            </h2>
          </div>

          {/* Bento asymétrique — copie exacte du style TrustSection */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
            {TRUST_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return f.dark ? (
                <div key={i} className={`group relative md:col-span-${f.span} md:row-span-1 rounded-[2rem] p-8 bg-surface-dark border border-white/5 overflow-hidden transition-all duration-500 hover:-translate-y-1 ${f.accent.hoverShadow} flex flex-col justify-between`}>
                  <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${f.accent.glow}`} />
                  {f.accent.gridColor && (
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(${f.accent.gridColor} 0.5px, transparent 0.5px), linear-gradient(90deg, ${f.accent.gridColor} 0.5px, transparent 0.5px)`, backgroundSize: '28px 28px' }} />
                  )}
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className={`w-12 h-12 rounded-2xl ${f.accent.bg} border ${f.accent.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${f.accent.text}`} />
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-white mb-1.5">{f.title}</h4>
                      <p className="text-sm font-medium text-white/35 max-w-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={i} className={`group relative md:col-span-${f.span} md:row-span-1 rounded-[2rem] p-8 bg-background-card border border-neutral-100 overflow-hidden transition-all duration-500 hover:-translate-y-1 ${f.accent.hoverShadow} flex flex-col justify-between`}>
                  <div className={`absolute -bottom-12 -right-12 w-40 h-40 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${f.accent.glow}`} />
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className={`w-12 h-12 rounded-2xl ${f.accent.bg} border ${f.accent.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${f.accent.text}`} />
                    </div>
                    <div>
                      <h4 className="font-black text-base text-foreground mb-1">{f.title}</h4>
                      <p className="text-sm font-medium text-foreground-muted leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════════ */}
      <section id="faq" className="bg-neutral-50 pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[38%_1fr] gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 mb-6">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Questions fréquentes</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-[1.1] mb-4">
                Vous avez des{' '}
                <span className="text-emerald-500">questions ?</span>
              </h2>
              <p className="text-foreground-muted text-sm font-medium leading-relaxed mb-10 max-w-sm">
                Tout ce que vous devez savoir sur le fonctionnement d&apos;ImmoLoc. Sinon, notre support est là.
              </p>
              <div className="relative bg-emerald-800 rounded-[2rem] p-8 border border-white/5 overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-white font-black text-base mb-1.5">Besoin d&apos;aide directe ?</p>
                  <p className="text-white/30 text-xs font-medium mb-6 leading-relaxed">Notre équipe support est disponible 7j/7.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="https://wa.me/221338001234" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white text-xs font-black rounded-full hover:bg-emerald-400 transition-all shadow-[0_0_20px_var(--emerald-500)] hover:shadow-[0_0_30px_var(--emerald-500)]">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a href={`mailto:support@${BRAND.domain}`} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-background-card/[0.04] border border-white/[0.08] text-white/70 text-xs font-black rounded-full hover:bg-background-card/[0.08] transition-all">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className={`rounded-[1.5rem] border overflow-hidden transition-all duration-500 ${isOpen ? 'bg-surface-dark border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.1)]' : 'bg-background-card border-neutral-100 hover:border-border hover:shadow-sm'}`}>
                    <button onClick={() => setOpenFaq(isOpen ? -1 : i)} className="w-full flex items-center gap-4 px-7 py-6 text-left">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-colors duration-300 ${isOpen ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-foreground-muted'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className={`flex-1 text-sm font-black leading-snug transition-colors duration-300 ${isOpen ? 'text-white' : 'text-neutral-800'}`}>{faq.q}</span>
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-background-card/[0.06] rotate-180' : 'bg-neutral-50'}`}>
                        <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? 'text-white/60' : 'text-neutral-300'}`} />
                      </span>
                    </button>
                    <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
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

      {/* ══ CTA FINAL ══════════════════════════════════════════════════ */}
      <section className="bg-background-card py-8 px-4 sm:px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-emerald-800 overflow-hidden rounded-[3rem]">
            <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-[400px] h-[300px] bg-accent-400/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="relative z-10 grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.04]">
              <div className="p-12 sm:p-16 flex flex-col gap-6">
                <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">Locataires</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white leading-[1.1] tracking-tight">
                  Trouvez votre logement{' '}
                  <span className="text-emerald-400">dès maintenant</span>
                </h3>
                <p className="text-white/30 text-sm font-medium leading-relaxed max-w-sm">Des centaines de logements vérifiés à Dakar, Saly, Saint-Louis et dans tout le Sénégal.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/logements" className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-emerald-500 text-white text-sm font-black rounded-full hover:bg-emerald-400 transition-all duration-300 shadow-[0_0_25px_var(--emerald-500)] hover:shadow-[0_0_40px_var(--emerald-500)] hover:scale-[1.02]">
                    Explorer les logements <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="p-12 sm:p-16 flex flex-col gap-6">
                <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">Propriétaires</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white leading-[1.1] tracking-tight">
                  Votre logement peut{' '}
                  <span className="text-emerald-400">travailler pour vous</span>
                </h3>
                <p className="text-white/30 text-sm font-medium leading-relaxed max-w-sm">Inscription gratuite, sans engagement. Publiez votre première annonce en 5 minutes.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/become-host" className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-emerald-500 text-white text-sm font-black rounded-full hover:bg-emerald-400 transition-all duration-300 shadow-[0_0_25px_var(--emerald-500)] hover:shadow-[0_0_40px_var(--emerald-500)] hover:scale-[1.02]">
                    Devenir hôte <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
