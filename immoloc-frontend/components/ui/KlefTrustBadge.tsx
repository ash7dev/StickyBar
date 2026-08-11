'use client';

import { ShieldCheck, Lock, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface KlefTrustBadgeProps {
  variant?: 'card' | 'compact' | 'banner';
  className?: string;
}

export function KlefTrustBadge({ variant = 'card', className }: KlefTrustBadgeProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('rounded-card border border-border bg-background-alt p-3.5 text-foreground shadow-xs', className)}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <ShieldCheck className="h-4 w-4 text-forest-700" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold text-foreground">
              <span> Garantie Séquestre Klef 100%</span>
            </div>
            <p className="text-[11px] leading-relaxed text-foreground-muted">
              Logement non conforme ou hôte absent ? Votre argent reste bloqué. Relogement immédiat ou remboursement 100% sous 2 heures.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn('section-inverse relative overflow-hidden p-5 shadow-md', className)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-border-inverse bg-white/10 text-on-inverse-marker">
              <ShieldCheck className="h-5 w-5 text-on-inverse-marker" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-sm font-bold text-on-inverse-display">
                  🛡️ Garantie Séquestre Klef 100%
                </h3>
                <span className="rounded-pill border border-forest-200/30 bg-forest-800/60 px-2.5 py-0.5 text-[10px] font-semibold text-on-inverse-marker">
                  Réservation Protégée
                </span>
              </div>
              <p className="text-xs leading-relaxed text-on-inverse-muted max-w-xl">
                Logement non conforme ou hôte absent ? Votre argent reste bloqué. Relogement immédiat ou remboursement 100% sous 2 heures.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-card border border-border bg-background-card p-4 sm:p-5 shadow-xs', className)}>
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
          <ShieldCheck className="h-4 w-4 text-forest-700" aria-hidden="true" />
        </span>
        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
            🛡️ Garantie Séquestre Klef 100%
          </h4>
          <p className="mt-0.5 text-[11px] font-medium text-foreground-muted">
            Paiement 100% sécurisé & protection voyageur
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed font-medium text-foreground">
        Logement non conforme ou hôte absent ? Votre argent reste bloqué. Relogement immédiat ou remboursement 100% sous 2 heures.
      </p>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-border pt-3">
        {[
          { icon: Lock, title: 'Séquestre bancaire', desc: 'Fonds libérés après check-in' },
          { icon: Clock, title: 'Réaction sous 2h', desc: 'Assistance & relogement rapide' },
          { icon: CheckCircle2, title: 'Satisfait ou remboursé', desc: '100% de remboursement garanti' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-2 rounded-inner bg-background-alt p-2.5 border border-border">
            <Icon className="h-4 w-4 shrink-0 text-forest-600 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-semibold text-foreground leading-tight">{title}</p>
              <p className="text-[10px] text-foreground-muted leading-tight mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
