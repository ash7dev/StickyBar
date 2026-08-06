import Link from 'next/link';
import { ShieldCheck, ShieldAlert, ShieldX, Clock, FileCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { StatutKyc } from '@/features/profile/types';

interface Props {
  statutKyc?: StatutKyc | string;
  onKycClick?: () => void;
}

type KycCardConfig = {
  badge: string;
  label: string;
  icon: typeof ShieldCheck;
  docLabel: string;
  cta: string | null;
  note?: string;
};

const KYC_CONFIG_MAP: Record<string, KycCardConfig> = {
  VERIFIE: {
    badge: 'border-gold-200 bg-gold-50 text-gold-700',
    label: 'Vérifié',
    icon: ShieldCheck,
    docLabel: 'Document enregistré et vérifié par Klef',
    cta: null,
  },
  VALIDE: {
    badge: 'border-gold-200 bg-gold-50 text-gold-700',
    label: 'Vérifié',
    icon: ShieldCheck,
    docLabel: 'Document enregistré et vérifié par Klef',
    cta: null,
  },
  EN_ATTENTE: {
    badge: 'border-warning-500/25 bg-warning-50 text-warning-700',
    label: 'En cours',
    icon: Clock,
    docLabel: 'Document reçu, en cours de vérification',
    cta: null,
    note: 'La vérification prend généralement 24 à 48 h ouvrées. Vous serez notifié dès qu’elle est terminée.',
  },
  REJETE: {
    badge: 'border-error-500/25 bg-error-50 text-error-700',
    label: 'Refusé',
    icon: ShieldX,
    docLabel: 'Le document n’a pas pu être validé',
    cta: 'Soumettre un nouveau document',
    note: 'Vérifiez que la pièce est en cours de validité, entièrement visible et lisible, sans reflet ni coin coupé.',
  },
  REFUSE: {
    badge: 'border-error-500/25 bg-error-50 text-error-700',
    label: 'Refusé',
    icon: ShieldX,
    docLabel: 'Le document n’a pas pu être validé',
    cta: 'Soumettre un nouveau document',
    note: 'Vérifiez que la pièce est en cours de validité, entièrement visible et lisible, sans reflet ni coin coupé.',
  },
  NON_VERIFIE: {
    badge: 'border-border bg-background-alt text-foreground-muted',
    label: 'Non soumis',
    icon: ShieldAlert,
    docLabel: 'Aucun document transmis pour le moment',
    cta: 'Soumettre ma pièce d’identité',
    note: 'La vérification d’identité est requise pour publier une annonce et recevoir des paiements.',
  },
  NON_SOUMIS: {
    badge: 'border-border bg-background-alt text-foreground-muted',
    label: 'Non soumis',
    icon: ShieldAlert,
    docLabel: 'Aucun document transmis pour le moment',
    cta: 'Soumettre ma pièce d’identité',
    note: 'La vérification d’identité est requise pour publier une annonce et recevoir des paiements.',
  },
  A_RENOUVELER: {
    badge: 'border-warning-500/25 bg-warning-50 text-warning-700',
    label: 'À renouveler',
    icon: RefreshCw,
    docLabel: 'Votre pièce d’identité a expiré',
    cta: 'Renouveler ma pièce d’identité',
    note: 'Veuillez transmettre une pièce d’identité valide pour maintenir votre compte vérifié.',
  },
  SUSPENDU: {
    badge: 'border-error-500/25 bg-error-50 text-error-700',
    label: 'Suspendu',
    icon: ShieldX,
    docLabel: 'Vérification suspendue',
    cta: 'Contacter le support',
    note: 'Votre dossier nécessite un examen complémentaire. Contactez le support Klef.',
  },
};

export function OwnerKycVerificationCard({ statutKyc = 'NON_VERIFIE', onKycClick }: Props) {
  const s = KYC_CONFIG_MAP[statutKyc] ?? KYC_CONFIG_MAP.NON_VERIFIE;
  const StatusIcon = s.icon;

  return (
    <section className="card space-y-5 p-6 sm:p-8">

      <header className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Vérification d’identité
          </h2>
          <p className="text-xs text-foreground-muted">
            Sécurité du compte et conformité légale
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-inner border border-border bg-background-alt p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-border bg-background-card text-foreground-muted">
            <FileCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              Carte d’identité nationale ou passeport
            </p>
            <p className="mt-0.5 text-xs text-foreground-muted">{s.docLabel}</p>
          </div>
        </div>

        <span className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-semibold',
          s.badge,
        )}>
          <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {s.label}
        </span>
      </div>

      {s.note && (
        <p className="text-xs leading-relaxed text-foreground-muted">{s.note}</p>
      )}

      {s.cta && (
        <div className="flex justify-end">
          {onKycClick ? (
            <button
              type="button"
              onClick={onKycClick}
              className="btn-action text-sm cursor-pointer"
            >
              <span>{s.cta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <Link href="/dashboard/profil/verifier-identite" className="btn-action text-sm">
              {s.cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}