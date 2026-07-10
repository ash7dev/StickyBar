'use client';

import { useQuery } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { AuthUser } from '@/lib/nestjs/types';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Lock, Bell, CreditCard, LogOut,
  ArrowLeftRight, ChevronRight, ShieldCheck,
  AlertCircle, Clock, CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ─── KYC config ──────────────────────────────────────────────────────────── */

const KYC_CFG = {
  VERIFIE:     { label: 'Vérifié',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck  },
  EN_ATTENTE:  { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Clock        },
  REJETE:      { label: 'Rejeté',     cls: 'bg-rose-50 text-rose-700 border-rose-200',          icon: AlertCircle  },
  A_RENOUVELER:{ label: 'À renouveler', cls: 'bg-orange-50 text-orange-700 border-orange-200',  icon: AlertCircle  },
  NON_VERIFIE: { label: 'Non vérifié', cls: 'bg-neutral-100 text-neutral-500 border-border', icon: AlertCircle },
  SUSPENDU:    { label: 'Suspendu',   cls: 'bg-rose-50 text-rose-700 border-rose-200',          icon: AlertCircle  },
} as const;

/* ─── Sections ────────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    title: 'Mon Profil',
    desc: 'Informations personnelles et avatar',
    icon: User,
    href: '/dashboard/profil',
  },
  {
    title: 'Mes Réservations',
    desc: 'Historique et séjours à venir',
    icon: CalendarDays,
    href: '/dashboard/reservations',
  },
  {
    title: 'Paiements & Wallet',
    desc: 'Historique des transactions et retraits',
    icon: CreditCard,
    href: '/dashboard/wallet',
  },
  {
    title: 'Sécurité',
    desc: 'Mot de passe et sessions actives',
    icon: Lock,
    href: '#',
    disabled: true,
  },
  {
    title: 'Notifications',
    desc: 'Alertes email, push et WhatsApp',
    icon: Bell,
    href: '#',
    disabled: true,
  },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function ParametresPage() {
  const router = useRouter();
  const { activeRole, estProprietaire, statutKyc, clearSession } = useRoleStore();
  const { switchRole, isSwitching } = useSwitchRole();

  const { data: user } = useQuery<AuthUser>({
    queryKey: ['user-me'],
    queryFn: () => nestFetch<AuthUser>(NEST_API.USERS.ME),
  });

  const kycCfg = KYC_CFG[statutKyc] ?? KYC_CFG.NON_VERIFIE;
  const KycIcon = kycCfg.icon;

  function handleLogout() {
    clearSession();
    router.push('/');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="pb-2">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Paramètres</h1>
        <p className="text-sm text-neutral-500 mt-1">Gérez votre compte et vos préférences</p>
      </div>

      {/* ── Profil ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-primary-100 border border-primary-200 flex items-center justify-center text-base font-black text-primary-700 shrink-0">
            {user ? (
              `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`
            ) : (
              <div className="w-10 h-3 bg-primary-200 rounded animate-pulse" />
            )}
          </div>

          {/* Identité */}
          <div className="flex-1 min-w-0">
            {user ? (
              <>
                <p className="text-base font-black text-neutral-900 leading-tight">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs font-medium text-neutral-400 mt-0.5 truncate">
                  {user.email ?? user.telephone}
                </p>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-neutral-100 rounded-lg animate-pulse" />
                <div className="h-3 w-48 bg-neutral-100 rounded-lg animate-pulse" />
              </div>
            )}
          </div>

          {/* KYC badge */}
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0',
            kycCfg.cls,
          )}>
            <KycIcon className="w-3 h-3" />
            {kycCfg.label}
          </span>
        </div>
      </div>

      {/* ── Mode actif ─────────────────────────────────────────────────────── */}
      {estProprietaire && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-4 h-4 text-neutral-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">Mode actif</p>
                <p className="text-xs text-neutral-400">Basculer entre propriétaire et locataire</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => switchRole('LOCATAIRE')}
                disabled={isSwitching || activeRole === 'LOCATAIRE'}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200',
                  activeRole === 'LOCATAIRE'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-600',
                )}
              >
                Locataire
              </button>
              <button
                onClick={() => switchRole('PROPRIETAIRE')}
                disabled={isSwitching || activeRole === 'PROPRIETAIRE'}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200',
                  activeRole === 'PROPRIETAIRE'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-600',
                )}
              >
                Propriétaire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation sections ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          const isLast = i === SECTIONS.length - 1;

          if (s.disabled) {
            return (
              <div
                key={s.title}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 opacity-40',
                  !isLast && 'border-b border-border',
                )}
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900">{s.title}</p>
                  <p className="text-xs text-neutral-400">{s.desc}</p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300 border border-border px-2 py-0.5 rounded-full">
                  Bientôt
                </span>
              </div>
            );
          }

          return (
            <Link
              key={s.title}
              href={s.href}
              className={cn(
                'flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors group',
                !isLast && 'border-b border-border',
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 group-hover:bg-primary-50 transition-colors">
                <Icon className="w-4 h-4 text-neutral-500 group-hover:text-primary-600 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900">{s.title}</p>
                <p className="text-xs text-neutral-400">{s.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* ── Déconnexion ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-rose-50 transition-colors group"
        >
          <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
            <LogOut className="w-4 h-4 text-neutral-500 group-hover:text-rose-600 transition-colors" />
          </div>
          <p className="text-sm font-bold text-neutral-900 group-hover:text-rose-700 transition-colors">
            Se déconnecter
          </p>
        </button>
      </div>

    </div>
  );
}
