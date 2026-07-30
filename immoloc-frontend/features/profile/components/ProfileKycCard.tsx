'use client';

import { ShieldCheck, ShieldAlert, ShieldX, Clock, RefreshCw, ArrowRight, Shield } from 'lucide-react';
import type { UserProfile, StatutKyc } from '../types';
import { KYC_CONFIG } from '../types';

interface Props {
  user: UserProfile;
  onKycClick?: () => void;
}

const KYC_ICONS: Record<StatutKyc, React.ComponentType<{ className?: string }>> = {
  NON_VERIFIE:  ShieldAlert,
  EN_ATTENTE:   Clock,
  VERIFIE:      ShieldCheck,
  REJETE:       ShieldX,
  A_RENOUVELER: RefreshCw,
  SUSPENDU:     ShieldX,
};

const KYC_STEPS = [
  { label: 'Soumission',   statuts: ['EN_ATTENTE', 'VERIFIE', 'REJETE', 'A_RENOUVELER', 'SUSPENDU'] },
  { label: 'Vérification', statuts: ['VERIFIE', 'REJETE', 'A_RENOUVELER', 'SUSPENDU'] },
  { label: 'Validé',       statuts: ['VERIFIE'] },
];

export function ProfileKycCard({ user, onKycClick }: Props) {
  const cfg  = KYC_CONFIG[user.statutKyc];
  const Icon = KYC_ICONS[user.statutKyc];

  return (
    <div className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0 shadow-2xs">
            <Shield className="w-4 h-4 text-lime-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-forest-950">Vérification KYC</h3>
            <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">Identité & Sécurité</p>
          </div>
        </div>

        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border text-[11px] font-extrabold bg-forest-50 text-forest-800 border-forest-100">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" />
          <span>{cfg.label}</span>
        </span>
      </div>

      <div className="space-y-4">
        {/* Bloc statut coloré */}
        <div className="flex items-start gap-3.5 bg-forest-950 text-white rounded-inner p-4 border border-forest-800 shadow-2xs">
          <div className="w-10 h-10 rounded-inner bg-forest-900 border border-lime-400/20 flex items-center justify-center shrink-0 text-lime-400">
            <Icon className="w-5 h-5 text-lime-400" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-display text-sm font-bold text-white">{cfg.label}</p>
            <p className="text-xs text-forest-200 font-medium mt-0.5 leading-relaxed">
              {cfg.description}
            </p>
          </div>
        </div>

        {/* Étapes de progression */}
        <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 space-y-2">
          <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">Progression de vérification</p>
          <div className="flex items-center gap-0 pt-1">
            {KYC_STEPS.map((step, i) => {
              const done     = step.statuts.includes(user.statutKyc);
              const isLast   = i === KYC_STEPS.length - 1;
              const isCurrent = !done && (i === 0
                ? !KYC_STEPS[0].statuts.includes(user.statutKyc)
                : KYC_STEPS[i - 1].statuts.includes(user.statutKyc) && !done);

              return (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      done
                        ? 'bg-forest-900 border-lime-400 text-lime-400 shadow-2xs'
                        : isCurrent
                          ? 'bg-forest-950 border-lime-400 text-lime-400'
                          : 'bg-background-card border-border text-foreground-faint'
                    }`}>
                      {done ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-border" />
                      )}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      done ? 'text-forest-950' : isCurrent ? 'text-forest-700' : 'text-foreground-faint'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mb-4 mx-1 ${done ? 'bg-lime-500' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA ou confirmation */}
        {cfg.cta ? (
          <button
            onClick={onKycClick}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 font-extrabold text-xs shadow-md transition-all active:scale-95"
          >
            <Icon className="w-4 h-4 text-forest-950" />
            <span>{cfg.cta}</span>
            <ArrowRight className="w-4 h-4 text-forest-950 ml-auto" />
          </button>
        ) : user.statutKyc === 'VERIFIE' ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-pill bg-forest-50 border border-forest-100 text-forest-800 text-xs font-extrabold">
            <ShieldCheck className="w-4 h-4 text-forest-600" />
            <span>Identité confirmée & vérifiée par Klef</span>
          </div>
        ) : user.statutKyc === 'EN_ATTENTE' ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-pill bg-warning-50 border border-warning-200 text-warning-800 text-xs font-extrabold">
            <Clock className="w-4 h-4 text-warning-600 animate-pulse" />
            <span>Vérification en cours par nos équipes…</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
