'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Lock, Database, Eye, UserCheck, Trash2, Download,
  Globe, Shield, Cookie, Mail, Bell, ChevronRight,
  ArrowUp, Server, FileText, Phone, Clock, Key,
  AlertTriangle, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { BRAND } from '@/lib/config';

/* ─── TOC ─────────────────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'responsable',    label: 'Responsable du traitement',    icon: Building2 },
  { id: 'collecte',       label: 'Données collectées',           icon: Database },
  { id: 'finalites',      label: 'Finalités du traitement',      icon: Eye },
  { id: 'base-legale',    label: 'Base légale',                  icon: FileText },
  { id: 'conservation',   label: 'Durée de conservation',        icon: Clock },
  { id: 'destinataires',  label: 'Destinataires',                icon: Globe },
  { id: 'transferts',     label: 'Transferts internationaux',    icon: Server },
  { id: 'droits',         label: 'Vos droits',                   icon: UserCheck },
  { id: 'cookies',        label: 'Cookies & traceurs',           icon: Cookie },
  { id: 'securite',       label: 'Sécurité',                     icon: Shield },
  { id: 'mineurs',        label: 'Protection des mineurs',       icon: AlertTriangle },
  { id: 'modifications',  label: 'Modifications',                icon: Bell },
  { id: 'contact',        label: 'Nous contacter',               icon: Mail },
] as const;

/* ─── Shared UI (self-contained) ──────────────────────────────────────────── */

function ArticleHeading({ id, number, title, icon: Icon }: {
  id: string; number: string; title: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div id={id} className="flex items-start gap-4 mb-6 scroll-mt-28">
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[11px] font-black text-violet-500 uppercase tracking-widest mb-0.5">
          Article {number}
        </p>
        <h2 className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight">{title}</h2>
      </div>
    </div>
  );
}

function InfoBox({ type = 'info', children }: {
  type?: 'info' | 'warning' | 'key' | 'success';
  children: React.ReactNode;
}) {
  const cfg = {
    info:    { bg: 'bg-violet-50 border-violet-200/60',   icon: '💡', text: 'text-violet-900' },
    warning: { bg: 'bg-amber-50 border-amber-200/60',     icon: '⚠️',  text: 'text-amber-900' },
    key:     { bg: 'bg-primary-50 border-primary-200/60', icon: '🔑',  text: 'text-primary-900' },
    success: { bg: 'bg-emerald-50 border-emerald-200/60', icon: '✅',  text: 'text-emerald-900' },
  }[type];
  return (
    <div className={cn('flex gap-3 p-4 rounded-2xl border my-4', cfg.bg)}>
      <span className="text-lg shrink-0 mt-0.5">{cfg.icon}</span>
      <div className={cn('text-sm leading-relaxed font-medium', cfg.text)}>{children}</div>
    </div>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] text-neutral-600 leading-[1.85] mb-4">{children}</p>;
}

function Ul({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-2 my-4 ml-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[14px] text-neutral-600 leading-relaxed">
          <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Dl({ items }: { items: { term: string; desc: string }[] }) {
  return (
    <dl className="space-y-3 my-4">
      {items.map(({ term, desc }) => (
        <div key={term} className="flex gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
          <dt className="shrink-0 font-black text-sm text-violet-600 min-w-[160px]">{term}</dt>
          <dd className="text-sm text-neutral-600 leading-relaxed">{desc}</dd>
        </div>
      ))}
    </dl>
  );
}

function RightCard({ icon: Icon, title, desc, color }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; color: string;
}) {
  return (
    <div className="flex gap-3 p-4 bg-white border border-neutral-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-bold text-sm text-neutral-900">{title}</p>
        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent my-10" />;
}

function RetentionRow({ category, duration, reason }: { category: string; duration: string; reason: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_1fr] gap-3 items-start p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
      <p className="text-sm font-semibold text-neutral-800">{category}</p>
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 text-[11px] font-black whitespace-nowrap">
        {duration}
      </span>
      <p className="text-xs text-neutral-500 leading-relaxed col-span-2 sm:col-span-1">{reason}</p>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

export function PrivacyPage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="bg-white min-h-screen">

      {/* ══ Hero ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-[#0d0714]">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-[15%] w-[500px] h-[400px] rounded-full bg-violet-600/25 blur-[130px]" />
          <div className="absolute bottom-0 right-[5%] w-[350px] h-[300px] rounded-full bg-primary-500/15 blur-[100px]" />
          <div className="absolute top-[40%] left-[60%] w-[200px] h-[200px] rounded-full bg-accent-400/10 blur-[80px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-70" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white/40 mb-8 flex-wrap">
            <Link href="/" className="hover:text-white/70 transition-colors">{BRAND.name}</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/cgu" className="hover:text-white/70 transition-colors">Légal</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">Politique de confidentialité</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-[11px] font-bold uppercase tracking-widest mb-6">
              <Lock className="w-3 h-3" />
              Protection des données
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
              Politique de<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-primary-400">
                Confidentialité
              </span>
            </h1>

            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
              La protection de vos données personnelles est une priorité absolue pour {BRAND.name}.
              Ce document explique comment nous collectons, utilisons et protégeons vos informations.
            </p>

            <div className="flex flex-wrap gap-4">
              {[
                { icon: Clock,     label: 'En vigueur depuis',  value: '1er janvier 2025' },
                { icon: FileText,  label: 'Version',            value: '1.4' },
                { icon: Shield,    label: 'Cadre juridique',    value: 'Loi sén. 2008-12 · RGPD' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl">
                  <Icon className="w-3.5 h-3.5 text-violet-400" />
                  <div>
                    <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-[13px] font-bold text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* ══ Body ══════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex gap-12 relative">

          {/* ── Sidebar TOC ─────────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 px-3">
                Sommaire
              </p>
              <nav className="space-y-0.5">
                {SECTIONS.map(({ id, label, icon: Icon }) => {
                  const active = activeId === id;
                  return (
                    <a key={id} href={`#${id}`}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group',
                        active
                          ? 'bg-violet-50 text-violet-700 border border-violet-100'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
                      )}>
                      <Icon className={cn('w-3.5 h-3.5 shrink-0 transition-colors',
                        active ? 'text-violet-500' : 'text-neutral-400 group-hover:text-neutral-600'
                      )} />
                      <span className="leading-tight">{label}</span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />}
                    </a>
                  );
                })}
              </nav>

              <div className="mt-6 p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                <p className="text-[11px] font-bold text-violet-600 mb-1">Délégué à la protection des données</p>
                <a href={`mailto:dpo@${BRAND.domain}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  dpo@{BRAND.domain}
                </a>
              </div>
            </div>
          </aside>

          {/* ── Content ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 max-w-3xl">

            {/* Art. 1 — Responsable */}
            <ArticleHeading id="responsable" number="1" title="Responsable du traitement" icon={Building2} />
            <Para>
              Le responsable du traitement de vos données personnelles est la société{' '}
              <strong>{BRAND.name} SAS</strong>, dont le siège social est situé à Dakar, Sénégal,
              immatriculée au Registre du Commerce et du Crédit Mobilier de Dakar.
            </Para>
            <Dl items={[
              { term: 'Raison sociale',  desc: `${BRAND.name} SAS` },
              { term: 'Siège social',    desc: 'Dakar, République du Sénégal' },
              { term: 'DPO',            desc: `dpo@${BRAND.domain}` },
              { term: 'Téléphone',      desc: '+221 33 XXX XX XX' },
            ]} />
            <InfoBox type="key">
              Conformément à la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la Protection
              des Données à caractère personnel et au RGPD (dans sa mesure applicable),{' '}
              {BRAND.name} s&apos;engage à traiter vos données de manière transparente, loyale
              et sécurisée.
            </InfoBox>

            <Divider />

            {/* Art. 2 — Données collectées */}
            <ArticleHeading id="collecte" number="2" title="Données collectées" icon={Database} />
            <Para>
              Nous collectons uniquement les données strictement nécessaires à la fourniture
              de nos services. Ces données se répartissent en plusieurs catégories :
            </Para>

            <div className="space-y-4 my-4">
              {[
                {
                  title: 'Données d\'identité',
                  color: 'bg-blue-500',
                  icon: UserCheck,
                  items: ['Nom et prénom', 'Date de naissance', 'Numéro de pièce d\'identité (KYC)', 'Photo de la pièce d\'identité', 'Selfie de vérification'],
                },
                {
                  title: 'Données de contact',
                  color: 'bg-emerald-500',
                  icon: Phone,
                  items: ['Numéro de téléphone mobile', 'Adresse e-mail', 'Adresse postale (optionnelle)'],
                },
                {
                  title: 'Données de transaction',
                  color: 'bg-violet-500',
                  icon: Lock,
                  items: ['Historique des réservations', 'Montants des transactions', 'Références de paiement', 'Numéros de mobile money (masqués)'],
                },
                {
                  title: 'Données d\'usage',
                  color: 'bg-amber-500',
                  icon: Eye,
                  items: ['Adresse IP', 'Type de navigateur et appareil', 'Pages visitées et durée', 'Recherches effectuées'],
                },
                {
                  title: 'Contenu généré',
                  color: 'bg-rose-500',
                  icon: FileText,
                  items: ['Photos des logements', 'Photos d\'état des lieux', 'Avis et évaluations', 'Messages échangés via la Plateforme'],
                },
              ].map(({ title, color, icon: Icon, items }) => (
                <div key={title} className="bg-neutral-50 rounded-2xl border border-neutral-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', color)}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="font-bold text-sm text-neutral-900">{title}</p>
                  </div>
                  <ul className="p-4 space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex gap-2 text-[13px] text-neutral-600">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-neutral-300 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <InfoBox type="warning">
              Nous ne collectons jamais vos numéros de carte bancaire complets — ceux-ci sont
              traités directement par nos prestataires de paiement certifiés PCI-DSS
              (Stripe, PayDunya). {BRAND.name} ne stocke que des tokens de référence.
            </InfoBox>

            <Divider />

            {/* Art. 3 — Finalités */}
            <ArticleHeading id="finalites" number="3" title="Finalités du traitement" icon={Eye} />
            <Para>
              Vos données sont collectées et traitées pour les finalités suivantes :
            </Para>
            <Dl items={[
              { term: 'Gestion du compte',      desc: 'Création, authentification, récupération et suppression de votre compte utilisateur.' },
              { term: 'Fourniture des services', desc: 'Mise en relation propriétaires/locataires, gestion des réservations, traitement des paiements, séquestre.' },
              { term: 'Vérification KYC',        desc: 'Vérification de votre identité pour prévenir la fraude et respecter nos obligations réglementaires.' },
              { term: 'Communication',           desc: 'Envoi de confirmations, rappels, notifications relatives à vos réservations et votre compte.' },
              { term: 'Amélioration du service', desc: 'Analyse anonymisée des usages pour améliorer la Plateforme, personnaliser l\'expérience.' },
              { term: 'Sécurité & fraude',       desc: 'Détection et prévention des activités frauduleuses, protection de notre infrastructure.' },
              { term: 'Obligations légales',     desc: 'Conservation des données de transaction conformément à la législation fiscale et commerciale sénégalaise.' },
            ]} />

            <Divider />

            {/* Art. 4 — Base légale */}
            <ArticleHeading id="base-legale" number="4" title="Base légale du traitement" icon={FileText} />
            <Para>
              Chaque traitement de données s&apos;appuie sur l&apos;une des bases légales suivantes :
            </Para>
            <div className="space-y-3 my-4">
              {[
                { base: 'Exécution du contrat',    color: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Traitement nécessaire à l\'exécution des services que vous avez demandés (réservations, paiements, KYC).' },
                { base: 'Obligation légale',        color: 'bg-blue-100 text-blue-800 border-blue-200',          desc: 'Conformité aux exigences de la loi 2008-12 et des réglementations fiscales sénégalaises.' },
                { base: 'Intérêt légitime',         color: 'bg-violet-100 text-violet-800 border-violet-200',    desc: 'Prévention de la fraude, amélioration de nos services, sécurité de la Plateforme.' },
                { base: 'Consentement',             color: 'bg-amber-100 text-amber-800 border-amber-200',       desc: 'Communications marketing, cookies non-essentiels. Retirable à tout moment.' },
              ].map(({ base, color, desc }) => (
                <div key={base} className="flex gap-3 items-start">
                  <span className={cn('shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black border mt-0.5 whitespace-nowrap', color)}>
                    {base}
                  </span>
                  <p className="text-sm text-neutral-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <Divider />

            {/* Art. 5 — Conservation */}
            <ArticleHeading id="conservation" number="5" title="Durée de conservation" icon={Clock} />
            <Para>
              Nous conservons vos données uniquement pour la durée nécessaire aux finalités
              pour lesquelles elles ont été collectées, ou pour satisfaire à nos obligations légales.
            </Para>
            <div className="space-y-2.5 my-4">
              <RetentionRow category="Données de compte actif" duration="Durée du compte" reason="Maintenu tant que votre compte est actif" />
              <RetentionRow category="Données de compte supprimé" duration="3 ans" reason="Obligations légales et prévention des fraudes après suppression" />
              <RetentionRow category="Données de transaction" duration="10 ans" reason="Conformité fiscale et comptable (Code général des impôts sénégalais)" />
              <RetentionRow category="Documents KYC" duration="5 ans" reason="Obligations LCB-FT (lutte contre le blanchiment)" />
              <RetentionRow category="Logs de connexion" duration="12 mois" reason="Sécurité et détection de fraude" />
              <RetentionRow category="Cookies analytiques" duration="13 mois" reason="Durée maximale autorisée par la réglementation" />
              <RetentionRow category="Photos d\'état des lieux" duration="6 mois" reason="Délai de prescription des litiges liés à l'état du logement" />
            </div>

            <Divider />

            {/* Art. 6 — Destinataires */}
            <ArticleHeading id="destinataires" number="6" title="Destinataires des données" icon={Globe} />
            <Para>
              Vos données peuvent être partagées avec les catégories de destinataires suivantes,
              dans la stricte limite des finalités définies :
            </Para>
            <div className="grid sm:grid-cols-2 gap-3 my-4">
              {[
                { label: 'Prestataires de paiement', desc: 'Wave, Orange Money, PayDunya, Stripe — pour traiter vos transactions de manière sécurisée.' },
                { label: 'Hébergement & cloud',       desc: 'Supabase (PostgreSQL), Cloudinary (médias) — hébergés en Europe ou en Afrique.' },
                { label: 'Service client',             desc: 'Notre équipe support accède à vos données uniquement pour résoudre vos demandes.' },
                { label: 'Autorités légales',          desc: 'Uniquement sur réquisition judiciaire ou obligation légale dûment établie.' },
              ].map(({ label, desc }) => (
                <div key={label} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <p className="font-bold text-sm text-neutral-900 mb-1">{label}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <InfoBox type="key">
              {BRAND.name} ne vend jamais vos données à des tiers à des fins commerciales.
              Aucun partage de données à des fins publicitaires sans votre consentement explicite.
            </InfoBox>

            <Divider />

            {/* Art. 7 — Transferts */}
            <ArticleHeading id="transferts" number="7" title="Transferts internationaux" icon={Server} />
            <Para>
              Certains de nos prestataires peuvent traiter vos données en dehors du Sénégal.
              Dans ce cas, nous veillons à ce que des garanties appropriées soient en place :
            </Para>
            <Ul items={[
              'Clauses contractuelles types approuvées par la Commission Européenne (pour les transferts vers l\'UE)',
              'Certification des prestataires (ISO 27001, SOC 2, PCI-DSS)',
              'Accord de traitement des données (DPA) signé avec chaque sous-traitant',
            ]} />
            <Para>
              Nos principaux prestataires hébergeant des données sont localisés en Europe
              (Supabase — Irlande, Stripe — Irlande) et aux États-Unis (Cloudinary — avec
              clauses contractuelles types en vigueur).
            </Para>

            <Divider />

            {/* Art. 8 — Droits */}
            <ArticleHeading id="droits" number="8" title="Vos droits" icon={UserCheck} />
            <Para>
              Conformément à la loi 2008-12 et au RGPD, vous bénéficiez des droits suivants
              sur vos données personnelles :
            </Para>
            <div className="grid sm:grid-cols-2 gap-3 my-4">
              <RightCard icon={Eye}      title="Droit d'accès"       color="bg-blue-500"    desc="Obtenir une copie de toutes les données que nous détenons vous concernant." />
              <RightCard icon={FileText} title="Droit de rectification" color="bg-emerald-500" desc="Corriger des données inexactes ou incomplètes." />
              <RightCard icon={Trash2}   title="Droit à l'effacement" color="bg-rose-500"    desc="Demander la suppression de vos données dans les cas prévus par la loi." />
              <RightCard icon={Download} title="Droit à la portabilité" color="bg-violet-500" desc="Recevoir vos données dans un format structuré et lisible par machine." />
              <RightCard icon={Lock}     title="Droit d'opposition"  color="bg-amber-500"   desc="Vous opposer au traitement basé sur notre intérêt légitime." />
              <RightCard icon={Key}      title="Droit de limitation"  color="bg-slate-500"   desc="Demander la limitation du traitement dans certaines circonstances." />
            </div>

            <InfoBox type="info">
              Pour exercer l&apos;un de ces droits, envoyez votre demande à{' '}
              <strong>privacy@{BRAND.domain}</strong> en joignant une copie de votre pièce
              d&apos;identité. Nous nous engageons à répondre dans un délai de{' '}
              <strong>30 jours</strong>. En cas de refus, vous pouvez saisir la Commission
              de Protection des Données Personnelles du Sénégal (CDP).
            </InfoBox>

            <Divider />

            {/* Art. 9 — Cookies */}
            <ArticleHeading id="cookies" number="9" title="Cookies et traceurs" icon={Cookie} />
            <Para>
              {BRAND.name} utilise des cookies et technologies similaires pour faire fonctionner
              la Plateforme, analyser son utilisation et personnaliser votre expérience.
            </Para>
            <div className="space-y-3 my-4">
              {[
                { name: 'Cookies essentiels',    required: true,  desc: 'Authentification, sécurité, préférences de session. Ne peuvent pas être désactivés.' },
                { name: 'Cookies analytiques',   required: false, desc: 'Analyse anonymisée du trafic (pages vues, parcours). Peuvent être refusés.' },
                { name: 'Cookies fonctionnels',  required: false, desc: 'Mémorisation de vos préférences (langue, ville, filtres). Peuvent être refusés.' },
              ].map(({ name, required, desc }) => (
                <div key={name} className="flex gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100 items-start">
                  <span className={cn('shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black mt-0.5',
                    required ? 'bg-rose-100 text-rose-700' : 'bg-neutral-200 text-neutral-600'
                  )}>
                    {required ? 'Requis' : 'Optionnel'}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-neutral-900">{name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Para>
              Vous pouvez gérer vos préférences de cookies à tout moment via le lien
              «&nbsp;Paramètres des cookies&nbsp;» en bas de chaque page de la Plateforme.
            </Para>

            <Divider />

            {/* Art. 10 — Sécurité */}
            <ArticleHeading id="securite" number="10" title="Sécurité des données" icon={Shield} />
            <Para>
              {BRAND.name} met en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données contre tout accès non autorisé,
              perte, altération ou divulgation :
            </Para>
            <Ul items={[
              'Chiffrement TLS 1.3 pour toutes les communications',
              'Chiffrement au repos des données sensibles (AES-256)',
              'Authentification multi-facteurs pour les accès administrateurs',
              'Audits de sécurité réguliers et tests de pénétration',
              'Accès aux données en production restreint au personnel habilité',
              'Journalisation des accès et surveillance en temps réel',
              'Plan de réponse aux incidents (notification sous 72h en cas de violation)',
            ]} />
            <InfoBox type="warning">
              En cas de violation de données susceptible d&apos;engendrer un risque élevé pour vos
              droits et libertés, {BRAND.name} s&apos;engage à vous notifier dans un délai de{' '}
              <strong>72 heures</strong> à compter de la découverte de l&apos;incident, conformément
              aux obligations légales applicables.
            </InfoBox>

            <Divider />

            {/* Art. 11 — Mineurs */}
            <ArticleHeading id="mineurs" number="11" title="Protection des mineurs" icon={AlertTriangle} />
            <Para>
              La Plateforme {BRAND.name} est exclusivement réservée aux personnes majeures
              (18 ans ou plus). Nous ne collectons sciemment aucune donnée personnelle
              de mineurs. Si vous êtes parent ou tuteur légal et pensez que votre enfant
              nous a fourni des données, contactez-nous immédiatement à{' '}
              <strong>privacy@{BRAND.domain}</strong> et nous procéderons à leur suppression.
            </Para>

            <Divider />

            {/* Art. 12 — Modifications */}
            <ArticleHeading id="modifications" number="12" title="Modifications de la politique" icon={Bell} />
            <Para>
              {BRAND.name} se réserve le droit de modifier la présente politique de
              confidentialité à tout moment pour refléter des changements dans nos pratiques
              ou les évolutions législatives.
            </Para>
            <Para>
              Toute modification substantielle sera notifiée par e-mail ou notification in-app
              avec un préavis minimum de <strong>15 jours</strong>. La date de «&nbsp;Dernière mise
              à jour&nbsp;» en bas de ce document indique la version en vigueur.
            </Para>

            <Divider />

            {/* Art. 13 — Contact */}
            <ArticleHeading id="contact" number="13" title="Nous contacter" icon={Mail} />
            <Para>
              Pour toute question relative à la protection de vos données personnelles,
              ou pour exercer vos droits, vous pouvez nous contacter via les canaux suivants :
            </Para>
            <div className="grid sm:grid-cols-3 gap-3 my-4">
              {[
                { icon: Mail,     label: 'E-mail DPO',    value: `dpo@${BRAND.domain}`,     href: `mailto:dpo@${BRAND.domain}` },
                { icon: Mail,     label: 'Confidentialité', value: `privacy@${BRAND.domain}`, href: `mailto:privacy@${BRAND.domain}` },
                { icon: Building2, label: 'Courrier',       value: 'Dakar, Sénégal',          href: '#' },
              ].map(({ icon: Icon, label, value, href }) => (
                <a key={label} href={href}
                  className="flex flex-col items-center text-center p-4 bg-neutral-50 hover:bg-violet-50 border border-neutral-100 hover:border-violet-200 rounded-2xl transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center mb-2 transition-colors">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-xs font-bold text-neutral-800 break-all">{value}</p>
                </a>
              ))}
            </div>
            <Para>
              Si vous estimez que vos droits n&apos;ont pas été respectés, vous pouvez introduire
              une réclamation auprès de la <strong>Commission de Protection des Données
              Personnelles du Sénégal (CDP)</strong>, autorité de contrôle compétente.
            </Para>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-400 font-semibold">Dernière mise à jour</p>
                <p className="text-sm font-bold text-neutral-700">1er janvier 2025 — Version 1.4</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/cgu"
                  className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-bold transition-colors">
                  <FileText className="w-4 h-4" />
                  Voir les CGU
                </Link>
                <a href={`mailto:privacy@${BRAND.domain}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 rounded-xl text-sm font-bold transition-colors">
                  <Mail className="w-4 h-4" />
                  Nous contacter
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-6 z-50 w-11 h-11 rounded-full bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-95"
          aria-label="Retour en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
