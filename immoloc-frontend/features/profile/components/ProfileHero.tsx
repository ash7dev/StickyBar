'use client';

import { CheckCircle2, Home, ShieldCheck, ArrowUpRight } from 'lucide-react';
import type { UserProfile } from '../types';
import { KYC_CONFIG, KYC_THEMES } from '../types';

interface Props {
  user: UserProfile;
  onKycClick?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  PROPRIETAIRE: 'Propriétaire',
  LOCATAIRE:    'Locataire',
  ADMIN:        'Administrateur',
};

export function ProfileHero({ user, onKycClick }: Props) {
  const initials   = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  const fullName   = `${user.prenom} ${user.nom}`;
  const kyc        = KYC_CONFIG[user.statutKyc];
  const kycTheme   = KYC_THEMES[kyc.theme];
  const isVerified = user.statutKyc === 'VERIFIE';

  return (
    <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-8">

        {/* ── Mobile layout ─────────────────────────────────── */}
        <div className="lg:hidden">
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-violet-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <span className="text-xl font-black text-white tracking-tight">{initials}</span>
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0a0a0a] flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Name + role */}
            <div className="min-w-0">
              <h2 className="text-lg font-black text-white tracking-tight truncate">{fullName}</h2>
              {user.email && (
                <p className="text-xs text-white/40 font-medium truncate mt-0.5">{user.email}</p>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                  <Home className="w-2.5 h-2.5" />
                  {ROLE_LABELS[user.activeRole] ?? user.activeRole}
                </span>
              </div>
            </div>
          </div>

          {/* KYC strip */}
          <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${kycTheme.bg} ${kycTheme.border}`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${kycTheme.dot}`} />
              <span className={`text-xs font-bold ${kycTheme.text}`}>{kyc.label}</span>
            </div>
            {kyc.cta && (
              <button onClick={onKycClick}
                className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg ${kycTheme.btn}`}>
                {kyc.cta.split(' ')[0]}
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── Desktop layout ────────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-violet-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <span className="text-3xl font-black text-white tracking-tight">{initials}</span>
            </div>
            {isVerified && (
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-[3px] border-[#0a0a0a] flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-white tracking-tight">{fullName}</h2>
              {isVerified && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-black text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  Vérifié
                </span>
              )}
            </div>
            {user.email && (
              <p className="text-sm text-white/40 font-medium mb-3">{user.email}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-black text-emerald-400 uppercase tracking-wider">
                <Home className="w-3 h-3" />
                {ROLE_LABELS[user.activeRole] ?? user.activeRole}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${kycTheme.bg} ${kycTheme.text} ${kycTheme.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${kycTheme.dot}`} />
                {kyc.label}
              </span>
            </div>
          </div>

          {/* KYC CTA */}
          {kyc.cta && (
            <button onClick={onKycClick}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${kycTheme.btn}`}>
              <ShieldCheck className="w-4 h-4" />
              {kyc.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
