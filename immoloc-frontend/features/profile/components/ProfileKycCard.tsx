'use client';

import { ShieldCheck, ShieldAlert, ShieldX, Clock, RefreshCw, ArrowRight, Shield } from 'lucide-react';
import type { UserProfile, StatutKyc } from '../types';
import { KYC_CONFIG, KYC_THEMES } from '../types';

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
  const cfg   = KYC_CONFIG[user.statutKyc];
  const theme = KYC_THEMES[cfg.theme];
  const Icon  = KYC_ICONS[user.statutKyc];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-lg hover:shadow-neutral-200/40 transition-all duration-300">

      {/* ── Header — bleu uniforme ──────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-primary-100 bg-primary-50 rounded-t-2xl">
        <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center border border-primary-200 shrink-0">
          <Shield className="w-[17px] h-[17px] text-primary-600" />
        </div>
        <div>
          <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Identité</p>
          <h3 className="text-sm font-bold text-neutral-900">Vérification KYC</h3>
        </div>
        {/* Badge statut inline dans le header */}
        <span className={`ml-auto shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black ${theme.bg} ${theme.text} ${theme.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
          {cfg.label}
        </span>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* ── Bloc statut coloré ───────────────────────────── */}
        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${theme.bg} ${theme.border}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${theme.icon} ${theme.border}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className={`text-sm font-black ${theme.text}`}>{cfg.label}</p>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5 leading-relaxed">
              {cfg.description}
            </p>
          </div>
        </div>

        {/* ── Étapes de progression ───────────────────────── */}
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-3">Progression</p>
          <div className="flex items-start gap-0">
            {KYC_STEPS.map((step, i) => {
              const done    = step.statuts.includes(user.statutKyc);
              const isLast  = i === KYC_STEPS.length - 1;
              const isCurrent = !done && (i === 0
                ? !KYC_STEPS[0].statuts.includes(user.statutKyc)
                : KYC_STEPS[i - 1].statuts.includes(user.statutKyc) && !done);

              return (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      done
                        ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200'
                        : isCurrent
                          ? `${theme.bg} ${theme.border} border-2`
                          : 'bg-white border-neutral-200'
                    }`}>
                      {done
                        ? <ShieldCheck className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        : isCurrent
                          ? <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                          : <span className="w-2 h-2 rounded-full bg-neutral-200" />}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      done ? 'text-emerald-600' : isCurrent ? theme.text : 'text-neutral-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mb-5 mx-0.5 ${done ? 'bg-emerald-400' : 'bg-neutral-100'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CTA ou confirmation ──────────────────────────── */}
        {cfg.cta ? (
          <button
            onClick={onKycClick}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold shadow-sm transition-all ${cfg.btnCls ?? theme.btn}`}
          >
            <Icon className="w-4 h-4" />
            {cfg.cta}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>
        ) : user.statutKyc === 'VERIFIE' ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-700">Identité confirmée</span>
          </div>
        ) : user.statutKyc === 'EN_ATTENTE' ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-50 border border-amber-100">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">Vérification en cours…</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
