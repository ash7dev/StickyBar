'use client';

import { Phone, CheckCircle2, XCircle, ArrowLeftRight, LogOut, Settings, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

function ActionRow({
  icon: Icon,
  iconCls = 'text-neutral-400',
  bgCls   = 'bg-neutral-50',
  borderCls = 'border-neutral-100',
  label,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconCls?: string;
  bgCls?: string;
  borderCls?: string;
  label: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-neutral-100 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${bgCls} ${borderCls}`}>
        <Icon className={`w-4 h-4 ${iconCls}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-neutral-900">{label}</p>
        {description && <p className="text-[11px] text-neutral-400 font-medium mt-0.5 truncate">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function ProfileActionsCard({ user }: Props) {
  const router = useRouter();
  const clearSession = useRoleStore((s) => s.clearSession);
  const { switchRole, isSwitching } = useSwitchRole();

  async function handleLogout() {
    const supabase = createClient();
    clearSession();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-lg hover:shadow-neutral-200/40 transition-all duration-300">

      {/* ── Header — bleu uniforme ──────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-100 bg-emerald-50 rounded-t-2xl">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200 shrink-0">
          <Lock className="w-[17px] h-[17px] text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Compte</p>
          <h3 className="text-sm font-bold text-neutral-900">Sécurité & actions</h3>
        </div>
      </div>

      <div className="px-5 py-1">
        {/* Téléphone */}
        <ActionRow
          icon={Phone}
          iconCls="text-emerald-500" bgCls="bg-emerald-50" borderCls="border-emerald-100"
          label="Téléphone"
          description={user.telephone ?? 'Aucun numéro enregistré'}
        >
          {user.phoneVerified ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Vérifié
            </span>
          ) : (
            <Link
              href="/dashboard/profil/verifier-telephone"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-black text-amber-600 shrink-0"
            >
              <XCircle className="w-3 h-3" />
              Vérifier
            </Link>
          )}
        </ActionRow>

        {/* Paramètres */}
        <ActionRow
          icon={Settings}
          iconCls="text-emerald-500" bgCls="bg-emerald-50" borderCls="border-emerald-100"
          label="Paramètres"
          description="Préférences et notifications"
        >
          <Link
            href="/dashboard/parametres"
            className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[10px] font-bold text-neutral-600 transition-colors shrink-0"
          >
            Ouvrir
          </Link>
        </ActionRow>

        {/* Switch mode */}
        {user.estProprietaire && (
          <ActionRow
            icon={ArrowLeftRight}
            iconCls="text-violet-500" bgCls="bg-violet-50" borderCls="border-violet-100"
            label="Mode Locataire"
            description="Accéder à l'espace locataire"
          >
            <button
              onClick={() => switchRole('LOCATAIRE')}
              disabled={isSwitching}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-[10px] font-bold text-emerald-600 transition-colors shrink-0 disabled:opacity-50"
            >
              {isSwitching ? 'Chargement…' : 'Basculer'}
            </button>
          </ActionRow>
        )}
      </div>

      {/* Déconnexion */}
      <div className="px-5 pb-4 pt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-sm font-bold text-rose-600 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
