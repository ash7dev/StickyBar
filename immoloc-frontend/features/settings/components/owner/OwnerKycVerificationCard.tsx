import { ShieldCheck, FileCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  statutKyc?: 'VALIDE' | 'EN_ATTENTE' | 'REFUSE' | 'NON_SOUMIS';
}

export function OwnerKycVerificationCard({ statutKyc = 'VALIDE' }: Props) {
  const isVerified = statutKyc === 'VALIDE';

  return (
    <div className="card p-6 sm:p-8 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-border/80">
        <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Vérification d'Identité Klef</h2>
          <p className="text-xs text-foreground-muted">Sécurité et conformité légale au Sénégal</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-inner bg-background-alt border border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-inner bg-gold-50 border border-gold-200 dark:bg-gold-500/10 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5 text-gold-600 dark:text-gold-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Pièce d'Identité Nationale / Passeport</p>
            <p className="text-xs text-foreground-muted">Document officiel enregistré et vérifié</p>
          </div>
        </div>

        <span className="badge-verified">
          <ShieldCheck className="w-3.5 h-3.5" />
          {isVerified ? 'Vérifié' : 'En attente'}
        </span>
      </div>

      {!isVerified && (
        <div className="flex justify-end pt-1">
          <Link
            href="/profil/verifier-identite"
            className="btn-action text-xs px-5 justify-center"
          >
            <span>Soumettre ma pièce d'identité</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
