'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Shield, CreditCard, Users, Home, Star,
  AlertTriangle, Scale, Lock, Mail, ChevronRight, ArrowUp,
  Banknote, Clock, CheckCircle2, XCircle, BookOpen,
  Building2, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { BRAND } from '@/lib/config';

/* ─── TOC items ───────────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'objet',           label: 'Objet & champ d\'application', icon: FileText },
  { id: 'definitions',     label: 'Définitions',                   icon: BookOpen },
  { id: 'inscription',     label: 'Inscription & KYC',             icon: Users },
  { id: 'annonces',        label: 'Annonces & propriétaires',      icon: Home },
  { id: 'reservations',    label: 'Réservations & locataires',     icon: Star },
  { id: 'paiements',       label: 'Paiements & séquestre',         icon: Banknote },
  { id: 'commission',      label: 'Commission & frais',            icon: CreditCard },
  { id: 'annulations',     label: 'Annulations',                   icon: XCircle },
  { id: 'etat-des-lieux',  label: 'État des lieux',               icon: CheckCircle2 },
  { id: 'litiges',         label: 'Litiges & médiation',           icon: Scale },
  { id: 'responsabilites', label: 'Responsabilités',               icon: Shield },
  { id: 'donnees',         label: 'Données personnelles',          icon: Lock },
  { id: 'droit',           label: 'Droit applicable',              icon: Building2 },
] as const;

/* ─── Shared sub-components ───────────────────────────────────────────────── */

function ArticleHeading({ id, number, title, icon: Icon }: {
  id: string; number: string; title: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div id={id} className="flex items-start gap-4 mb-6 scroll-mt-28">
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[11px] font-black text-primary-500 uppercase tracking-widest mb-0.5">
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
    info:    { bg: 'bg-primary-50 border-primary-200/60',   icon: '💡', text: 'text-primary-800' },
    warning: { bg: 'bg-amber-50 border-amber-200/60',       icon: '⚠️',  text: 'text-amber-900' },
    key:     { bg: 'bg-violet-50 border-violet-200/60',     icon: '🔑',  text: 'text-violet-900' },
    success: { bg: 'bg-emerald-50 border-emerald-200/60',   icon: '✅',  text: 'text-emerald-900' },
  }[type];

  return (
    <div className={cn('flex gap-3 p-4 rounded-2xl border my-4', cfg.bg)}>
      <span className="text-lg shrink-0 mt-0.5">{cfg.icon}</span>
      <div className={cn('text-sm leading-relaxed font-medium', cfg.text)}>{children}</div>
    </div>
  );
}

function Dl({ items }: { items: { term: string; desc: string }[] }) {
  return (
    <dl className="space-y-3 my-4">
      {items.map(({ term, desc }) => (
        <div key={term} className="flex gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
          <dt className="shrink-0 font-black text-sm text-primary-600 min-w-[120px]">{term}</dt>
          <dd className="text-sm text-neutral-600 leading-relaxed">{desc}</dd>
        </div>
      ))}
    </dl>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] text-neutral-600 leading-[1.85] mb-4">{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 my-4 ml-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[14px] text-neutral-600 leading-relaxed">
          <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-primary-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function RateCard({ label, rate, desc }: { label: string; rate: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-2xl shadow-sm">
      <div className="text-2xl font-black text-primary-600 min-w-[60px] text-center">{rate}</div>
      <div>
        <p className="text-sm font-bold text-neutral-900">{label}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent my-10" />;
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

export function CGUPage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );

    ids.forEach((id) => {
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

      {/* ══ Hero ═══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-[#07090f]">
        {/* Background layers */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-[20%] w-[500px] h-[500px] rounded-full bg-primary-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-[10%] w-[400px] h-[300px] rounded-full bg-accent-500/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L3N2Zz4=')] opacity-60" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white/40 mb-8">
            <Link href="/" className="hover:text-white/70 transition-colors">{BRAND.name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">Conditions Générales d&apos;Utilisation</span>
          </div>

          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/15 border border-primary-500/25 text-primary-300 text-[11px] font-bold uppercase tracking-widest mb-6">
              <FileText className="w-3 h-3" />
              Document légal
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
              Conditions<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
                Générales
              </span>{' '}
              d&apos;Utilisation
            </h1>

            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
              En utilisant {BRAND.name}, vous acceptez les présentes conditions qui régissent
              l&apos;ensemble des services proposés sur notre plateforme.
            </p>

            {/* Meta strip */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Clock,   label: 'En vigueur depuis',  value: '1er janvier 2025' },
                { icon: FileText, label: 'Version',            value: '2.1' },
                { icon: Building2, label: 'Droit applicable',  value: 'République du Sénégal' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl">
                  <Icon className="w-3.5 h-3.5 text-primary-400" />
                  <div>
                    <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-[13px] font-bold text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* ══ Body ══════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex gap-12 relative">

          {/* ── Sticky TOC sidebar ──────────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 px-3">
                Sommaire
              </p>
              <nav className="space-y-0.5">
                {SECTIONS.map(({ id, label, icon: Icon }) => {
                  const active = activeId === id;
                  return (
                    <a
                      key={id}
                      href={`#${id}`}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group',
                        active
                          ? 'bg-primary-50 text-primary-700 border border-primary-100'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
                      )}
                    >
                      <Icon className={cn('w-3.5 h-3.5 shrink-0 transition-colors',
                        active ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-600'
                      )} />
                      <span className="leading-tight">{label}</span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />}
                    </a>
                  );
                })}
              </nav>

              <div className="mt-6 p-4 bg-neutral-50 border border-neutral-100 rounded-2xl">
                <p className="text-[11px] font-bold text-neutral-500 mb-2">Besoin d&apos;aide ?</p>
                <a
                  href={`mailto:legal@${BRAND.domain}`}
                  className="flex items-center gap-2 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  legal@{BRAND.domain}
                </a>
              </div>
            </div>
          </aside>

          {/* ── Content ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 max-w-3xl">

            {/* ── Article 1 ── Objet ─────────────────────────────────────── */}
            <ArticleHeading id="objet" number="1" title="Objet et champ d'application" icon={FileText} />
            <Para>
              Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») régissent
              l&apos;accès et l&apos;utilisation de la plateforme <strong>{BRAND.name}</strong> (ci-après « la Plateforme »),
              accessible à l&apos;adresse <strong>{BRAND.domain}</strong>, éditée par la société {BRAND.name} SAS,
              immatriculée au Registre du Commerce et du Crédit Mobilier de Dakar.
            </Para>
            <Para>
              {BRAND.name} est une marketplace de mise en relation entre des propriétaires de logements
              (ci-après « Propriétaires ») et des particuliers souhaitant louer ces logements pour
              des séjours de courte ou moyenne durée (ci-après « Locataires »), principalement au Sénégal.
            </Para>
            <InfoBox type="key">
              {BRAND.name} agit en qualité d&apos;intermédiaire et n&apos;est pas partie au contrat de location
              entre le Propriétaire et le Locataire. La Plateforme facilite la mise en relation, sécurise
              les paiements et propose un service de médiation en cas de litige.
            </InfoBox>
            <Para>
              Toute utilisation de la Plateforme implique l&apos;acceptation pleine et entière des présentes
              CGU. Si vous n&apos;acceptez pas ces conditions, vous devez cesser immédiatement d&apos;utiliser
              nos services.
            </Para>

            <Divider />

            {/* ── Article 2 ── Définitions ─────────────────────────────── */}
            <ArticleHeading id="definitions" number="2" title="Définitions" icon={BookOpen} />
            <Dl items={[
              { term: 'Plateforme',     desc: `Le site web et l'application mobile ${BRAND.name}, ainsi que tous les services associés.` },
              { term: 'Utilisateur',    desc: 'Toute personne physique ou morale ayant créé un compte sur la Plateforme.' },
              { term: 'Propriétaire',   desc: 'Utilisateur publiant une ou plusieurs annonces de logement à louer.' },
              { term: 'Locataire',      desc: 'Utilisateur effectuant une réservation de logement via la Plateforme.' },
              { term: 'Annonce',        desc: "Description détaillée d'un logement mise en ligne par un Propriétaire, incluant photos, tarifs et conditions." },
              { term: 'Réservation',    desc: 'Accord contractuel entre un Propriétaire et un Locataire, validé via la Plateforme.' },
              { term: 'Séquestre',      desc: `Mécanisme par lequel ${BRAND.name} retient temporairement le montant de la réservation jusqu'à la confirmation du check-in par les deux parties.` },
              { term: 'KYC',            desc: 'Know Your Customer — Procédure de vérification d\'identité obligatoire pour tout Propriétaire souhaitant publier une annonce.' },
              { term: 'Commission',     desc: `Frais de service prélevés par ${BRAND.name} sur chaque transaction, permettant de financer la Plateforme et ses services.` },
              { term: 'FCFA',           desc: 'Franc CFA (XOF), monnaie officielle utilisée pour toutes les transactions sur la Plateforme.' },
            ]} />

            <Divider />

            {/* ── Article 3 ── Inscription ─────────────────────────────── */}
            <ArticleHeading id="inscription" number="3" title="Inscription et vérification d'identité (KYC)" icon={Users} />
            <Para>
              L&apos;inscription sur {BRAND.name} est gratuite et ouverte à toute personne physique majeure
              (18 ans ou plus) ou morale. Pour créer un compte, vous devez fournir des informations
              exactes, complètes et à jour.
            </Para>
            <Para>
              L&apos;inscription peut s&apos;effectuer via :<br />
            </Para>
            <Ul items={[
              'Numéro de téléphone mobile (OTP par SMS)',
              'Adresse e-mail et mot de passe',
              'Compte Google (OAuth 2.0)',
            ]} />

            <InfoBox type="warning">
              <strong>Vérification KYC obligatoire pour les Propriétaires.</strong> Avant toute publication
              d&apos;annonce, chaque Propriétaire doit soumettre une pièce d&apos;identité valide (CNI, passeport ou
              permis de conduire sénégalais). {BRAND.name} se réserve le droit de rejeter toute demande
              non-conforme ou de suspendre un compte en cas de fausse déclaration.
            </InfoBox>

            <Para>
              Vous êtes seul responsable de la confidentialité de vos identifiants de connexion.
              Toute activité effectuée depuis votre compte vous est entièrement imputable. En cas
              de compromission de votre compte, vous devez nous en informer immédiatement à l&apos;adresse
              {' '}<strong>security@{BRAND.domain}</strong>.
            </Para>

            <Divider />

            {/* ── Article 4 ── Annonces ─────────────────────────────────── */}
            <ArticleHeading id="annonces" number="4" title="Annonces et obligations des Propriétaires" icon={Home} />
            <Para>
              Les Propriétaires peuvent publier des annonces de logements (appartements, villas,
              studios, chambres, duplex, penthouses) pour des locations de courte et moyenne durée.
              Chaque annonce doit respecter les exigences suivantes :
            </Para>
            <Ul items={[
              'Minimum 5 photos de qualité représentant fidèlement le logement',
              'Description complète et honnête du logement et de ses équipements',
              'Prix de base par nuit en FCFA, clairement indiqué',
              'Localisation précise (ville, quartier, adresse)',
              'Règlement intérieur explicite',
              'Disponibilité à jour sur le calendrier',
            ]} />

            <InfoBox type="info">
              Toute nouvelle annonce est soumise à une vérification par l&apos;équipe {BRAND.name} avant
              publication. Ce processus dure généralement <strong>24 à 48 heures</strong>. Une annonce
              peut être rejetée si elle ne respecte pas nos standards de qualité ou contient des
              informations inexactes.
            </InfoBox>

            <Para>
              Le Propriétaire s&apos;engage à maintenir son logement dans un état correspondant aux
              informations publiées, à respecter les réservations confirmées et à accueillir les
              Locataires dans les conditions convenues. Tout annulation abusive ou logement non-conforme
              peut entraîner la suspension du compte.
            </Para>

            <Divider />

            {/* ── Article 5 ── Réservations ─────────────────────────────── */}
            <ArticleHeading id="reservations" number="5" title="Réservations et obligations des Locataires" icon={Star} />
            <Para>
              La réservation d&apos;un logement via {BRAND.name} est un engagement contractuel entre le
              Locataire et le Propriétaire. Elle se déroule en plusieurs étapes :
            </Para>
            <div className="space-y-3 my-4">
              {[
                { step: '1', label: 'Sélection', desc: 'Le Locataire choisit le logement, les dates et le nombre de voyageurs.' },
                { step: '2', label: 'Paiement', desc: 'Le montant total est débité et placé en séquestre par ImmoLoc.' },
                { step: '3', label: 'Confirmation', desc: 'Le Propriétaire dispose de 24h pour confirmer la réservation.' },
                { step: '4', label: 'Check-in', desc: 'Les deux parties valident l\'arrivée via la Plateforme. Le séquestre est libéré après 48h.' },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {step}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-neutral-900">{label}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Para>
              Le Locataire s&apos;engage à utiliser le logement conformément à sa destination d&apos;habitation,
              à respecter les règles de la maison, à ne pas sous-louer ou céder sa réservation à un
              tiers, et à laisser le logement dans un état comparable à son état d&apos;arrivée.
            </Para>

            <InfoBox type="warning">
              <strong>Divulgation des coordonnées.</strong> Les numéros de téléphone des parties ne sont
              révélés qu&apos;à <strong>48 heures avant le début du séjour</strong>. Toute tentative de
              contacter ou de payer directement le Propriétaire pour contourner la Plateforme constitue
              une violation grave des CGU et peut entraîner la résiliation définitive du compte.
            </InfoBox>

            <Divider />

            {/* ── Article 6 ── Paiements & Séquestre ───────────────────── */}
            <ArticleHeading id="paiements" number="6" title="Paiements et système de séquestre" icon={Banknote} />
            <Para>
              Tous les paiements transitent exclusivement par la Plateforme {BRAND.name}.
              Les moyens de paiement acceptés sont :
            </Para>
            <Ul items={[
              'Wave (portefeuille mobile)',
              'Orange Money',
              'PayDunya',
              'Carte bancaire (via Stripe — Visa, Mastercard)',
            ]} />

            <div className="my-6 p-5 bg-gradient-to-br from-primary-900 to-primary-950 rounded-3xl border border-primary-800/50 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-300" />
                </div>
                <div>
                  <p className="font-black text-sm">Système de Séquestre {BRAND.name}</p>
                  <p className="text-[11px] text-primary-300 font-semibold">Protection maximale pour les deux parties</p>
                </div>
              </div>
              <div className="space-y-3 text-[13px] text-primary-200 leading-relaxed">
                <p>
                  À la réservation, le montant total est <strong className="text-white">bloqué</strong> sur
                  le compte de séquestre {BRAND.name}. Le Propriétaire ne reçoit son paiement qu&apos;après
                  validation du check-in par les deux parties.
                </p>
                <p>
                  En cas de litige, les fonds restent bloqués jusqu&apos;à résolution par notre équipe de
                  médiation (délai maximum : <strong className="text-white">7 jours ouvrés</strong>).
                </p>
                <p>
                  La référence séquestre (format <strong className="text-white">SEQ-XXXXXXXX</strong>) figure
                  sur le contrat de location et constitue la preuve du paiement sécurisé.
                </p>
              </div>
            </div>

            <Para>
              Les virements vers le portefeuille du Propriétaire sont effectués sous
              <strong> 24 à 48 heures</strong> après confirmation du check-in. Les retraits depuis le
              portefeuille vers un compte mobile money ou bancaire sont traités sous
              <strong> 2 à 5 jours ouvrés</strong>.
            </Para>

            <Divider />

            {/* ── Article 7 ── Commission ───────────────────────────────── */}
            <ArticleHeading id="commission" number="7" title="Commission et frais de service" icon={CreditCard} />
            <Para>
              {BRAND.name} perçoit une commission sur chaque réservation confirmée, répartie comme suit :
            </Para>
            <div className="grid sm:grid-cols-2 gap-3 my-4">
              <RateCard
                label="Frais Locataire"
                rate="8 %"
                desc="Ajoutés au prix affiché lors du paiement"
              />
              <RateCard
                label="Commission Propriétaire"
                rate="5 %"
                desc="Déduits du montant reversé au Propriétaire"
              />
            </div>

            <InfoBox type="info">
              Le montant affiché sur l&apos;annonce est le prix <strong>hors frais de service</strong>.
              Le détail complet (prix base + frais locataire + total) est présenté avant toute
              confirmation de paiement. Aucun frais caché.
            </InfoBox>

            <Para>
              La commission est automatiquement déduite lors du traitement du paiement. Elle n&apos;est
              pas remboursable sauf en cas d&apos;annulation par le Propriétaire ou de défaut grave
              du logement constaté dans les 24 heures suivant le check-in.
            </Para>

            <Divider />

            {/* ── Article 8 ── Annulations ──────────────────────────────── */}
            <ArticleHeading id="annulations" number="8" title="Politique d'annulation" icon={XCircle} />
            <Para>
              La politique d&apos;annulation applicable est celle choisie par le Propriétaire lors de
              la création de l&apos;annonce. Trois niveaux sont disponibles :
            </Para>
            <div className="space-y-3 my-4">
              {[
                { name: 'Flexible',   color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', rule: 'Remboursement intégral si annulation ≥ 24h avant le check-in.' },
                { name: 'Modérée',    color: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-500',   rule: 'Remboursement intégral si annulation ≥ 5 jours avant. 50 % si annulation entre 1 et 5 jours avant.' },
                { name: 'Stricte',    color: 'bg-rose-50 border-rose-200',       dot: 'bg-rose-500',    rule: 'Remboursement intégral si annulation dans les 48h suivant la réservation (et ≥ 14 jours avant check-in). Aucun remboursement au-delà.' },
              ].map(({ name, color, dot, rule }) => (
                <div key={name} className={cn('flex gap-3 p-4 rounded-xl border', color)}>
                  <div className={cn('w-2 h-2 rounded-full shrink-0 mt-2', dot)} />
                  <div>
                    <p className="font-bold text-sm text-neutral-900 mb-0.5">{name}</p>
                    <p className="text-sm text-neutral-600">{rule}</p>
                  </div>
                </div>
              ))}
            </div>

            <InfoBox type="warning">
              En cas d&apos;annulation par le <strong>Propriétaire</strong>, le Locataire est intégralement
              remboursé (y compris les frais de service) et le Propriétaire peut se voir appliquer
              une pénalité de <strong>10 % du montant de la réservation</strong>, prélevée sur son
              portefeuille {BRAND.name}.
            </InfoBox>

            <Divider />

            {/* ── Article 9 ── État des lieux ───────────────────────────── */}
            <ArticleHeading id="etat-des-lieux" number="9" title="État des lieux" icon={CheckCircle2} />
            <Para>
              {BRAND.name} propose un système d&apos;état des lieux numérique intégré à la Plateforme.
              Propriétaires et Locataires peuvent téléverser des photos horodatées documentant
              l&apos;état du logement à l&apos;arrivée (check-in) et au départ (check-out).
            </Para>
            <Ul items={[
              'Les photos d\'état des lieux sont stockées et horodatées par ImmoLoc',
              'Elles constituent une preuve en cas de litige sur l\'état du logement',
              'Le Propriétaire dispose de 48h après le check-out pour déclarer tout dommage',
              'Passé ce délai, aucune réclamation relative à l\'état du logement ne sera recevable',
            ]} />
            <Para>
              En l&apos;absence d&apos;état des lieux photographique, c&apos;est la présomption de bon état
              général qui s&apos;applique, conformément au droit sénégalais applicable aux baux.
            </Para>

            <Divider />

            {/* ── Article 10 ── Litiges ─────────────────────────────────── */}
            <ArticleHeading id="litiges" number="10" title="Litiges et médiation" icon={Scale} />
            <Para>
              En cas de différend entre un Propriétaire et un Locataire, les parties s&apos;engagent
              à tenter une résolution amiable en premier lieu via le service de médiation {BRAND.name}.
            </Para>
            <Para>
              Pour déclarer un litige, le demandeur doit :
            </Para>
            <Ul items={[
              `Accéder à sa réservation sur ${BRAND.name}`,
              'Cliquer sur "Déclarer un litige" et décrire le problème',
              'Joindre toutes les preuves disponibles (photos, messages, etc.)',
              `Soumettre dans un délai de 48h après le check-out`,
            ]} />

            <InfoBox type="info">
              Le service de médiation {BRAND.name} s&apos;engage à rendre une décision sous
              <strong> 7 jours ouvrés</strong> à compter de la réception du dossier complet.
              Pendant cette période, les fonds en séquestre restent bloqués.
              La décision de {BRAND.name} s&apos;impose aux deux parties dans le cadre de la Plateforme.
            </InfoBox>

            <Para>
              Si la médiation échoue ou si l&apos;une des parties conteste la décision, le différend
              peut être porté devant les juridictions compétentes de Dakar, conformément à
              l&apos;article 13.
            </Para>

            <Divider />

            {/* ── Article 11 ── Responsabilités ─────────────────────────── */}
            <ArticleHeading id="responsabilites" number="11" title="Responsabilités" icon={Shield} />
            <Para>
              {BRAND.name} met en œuvre tous les moyens raisonnables pour assurer la disponibilité
              et la fiabilité de la Plateforme, mais ne garantit pas un accès ininterrompu
              ou exempt d&apos;erreurs.
            </Para>

            <InfoBox type="key">
              {BRAND.name} n&apos;est pas responsable du contenu des annonces publiées par les
              Propriétaires, des inexactitudes dans les descriptions de logements, des dommages
              survenus lors d&apos;un séjour, ou de tout manquement contractuel entre les parties.
              Sa responsabilité est limitée au montant des frais de service perçus sur la
              transaction concernée.
            </InfoBox>

            <Para>
              Chaque Utilisateur est personnellement responsable des informations qu&apos;il publie
              et des actions qu&apos;il effectue sur la Plateforme. Il garantit {BRAND.name} contre
              tout recours de tiers résultant de son utilisation de nos services.
            </Para>

            <Divider />

            {/* ── Article 12 ── Données ─────────────────────────────────── */}
            <ArticleHeading id="donnees" number="12" title="Protection des données personnelles" icon={Lock} />
            <Para>
              {BRAND.name} collecte et traite vos données personnelles conformément à la loi
              sénégalaise n° 2008-12 du 25 janvier 2008 portant sur la Protection des Données
              à caractère personnel, ainsi qu&apos;au Règlement Général sur la Protection des Données
              (RGPD) de l&apos;Union Européenne dans la mesure applicable.
            </Para>
            <Para>
              Les données collectées incluent notamment : nom, prénom, numéro de téléphone,
              adresse e-mail, pièce d&apos;identité (KYC), données de paiement, et historique des
              transactions. Ces données sont utilisées exclusivement pour :
            </Para>
            <Ul items={[
              'La gestion de votre compte et de vos réservations',
              'La vérification d\'identité (KYC)',
              'Le traitement des paiements et la lutte contre la fraude',
              'L\'amélioration de nos services et la personnalisation',
              'Le respect de nos obligations légales et réglementaires',
            ]} />
            <Para>
              Vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité
              de vos données. Pour exercer ces droits, contactez-nous à{' '}
              <strong>privacy@{BRAND.domain}</strong>.
            </Para>

            <Divider />

            {/* ── Article 13 ── Droit applicable ────────────────────────── */}
            <ArticleHeading id="droit" number="13" title="Droit applicable et juridiction" icon={Building2} />
            <Para>
              Les présentes CGU sont régies par le droit de la République du Sénégal.
              En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes,
              les parties s&apos;engagent à rechercher une solution amiable. À défaut, les tribunaux
              compétents de Dakar seront seuls compétents.
            </Para>
            <Para>
              {BRAND.name} se réserve le droit de modifier les présentes CGU à tout moment.
              Les Utilisateurs seront informés de toute modification substantielle par e-mail
              ou notification in-app, avec un préavis minimum de <strong>30 jours</strong>.
              La poursuite de l&apos;utilisation de la Plateforme après ce délai vaut acceptation
              des nouvelles conditions.
            </Para>

            {/* Last updated */}
            <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-400 font-semibold">Dernière mise à jour</p>
                <p className="text-sm font-bold text-neutral-700">1er janvier 2025 — Version 2.1</p>
              </div>
              <div className="flex items-center gap-3">
                <a href={`mailto:legal@${BRAND.domain}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-100 text-primary-700 rounded-xl text-sm font-bold transition-colors">
                  <Mail className="w-4 h-4" />
                  Nous contacter
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scroll to top ──────────────────────────────────────────────────── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-6 z-50 w-11 h-11 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-95"
          aria-label="Retour en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
