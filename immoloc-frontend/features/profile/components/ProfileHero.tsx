'use client';

import { CheckCircle2, Home, ShieldCheck, ArrowUpRight } from 'lucide-react';
import type { UserProfile } from '../types';
import { KYC_CONFIG } from '../types';

interface Props {
  user: UserProfile;
  onKycClick?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  PROPRIETAIRE: 'Mode Propriétaire',
  LOCATAIRE:    'Mode Locataire',
  ADMIN:        'Administrateur',
};

export function ProfileHero({ user, onKycClick }: Props) {
  const initials   = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  const fullName   = `${user.prenom} ${user.nom}`;
  const kyc        = KYC_CONFIG[user.statutKyc];
  const isVerified = user.statutKyc === 'VERIFIE';

  return (
    <div className="relative rounded-card border border-forest-800/90 bg-gradient-to-b from-forest-950 via-[#072A20] to-forest-950 p-6 sm:p-8 shadow-2xl overflow-hidden text-white">
      {/* Halos de fond */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-lime-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-forest-600/20 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

        {/* Identité + Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-inner bg-forest-900 text-lime-400 font-display font-extrabold text-2xl flex items-center justify-center border border-lime-400/20 shadow-md">
              {initials}
            </div>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-lime-400 border-2 border-forest-950 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-forest-950" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                {fullName}
              </h2>
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-lime-400/10 border border-lime-400/30 text-[11px] font-extrabold text-lime-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
                  Compte vérifié
                </span>
              )}
            </div>

            {user.email && (
              <p className="text-xs text-forest-200 font-medium truncate">{user.email}</p>
            )}

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-forest-900 border border-forest-800 text-lime-300 text-xs font-bold shadow-2xs">
                <Home className="w-3.5 h-3.5 text-lime-400" />
                <span>{ROLE_LABELS[user.activeRole] ?? user.activeRole}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-forest-900/60 border border-forest-800 text-forest-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                <span>{kyc.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action KYC */}
        {kyc.cta && (
          <button
            onClick={onKycClick}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 font-extrabold text-xs shadow-md transition-all active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-forest-950" />
            <span>{kyc.cta}</span>
            <ArrowUpRight className="w-4 h-4 text-forest-950" />
          </button>
        )}

      </div>
    </div>
  );
}
