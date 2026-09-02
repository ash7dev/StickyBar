'use client';

import { Building2, CheckCircle2, MessageSquare, PhoneCall, Sparkles, UserCheck } from 'lucide-react';

interface Props {
  totalLeads: number;
  newLeadsCount: number;
  contactedLeadsCount: number;
  convertedLeadsCount: number;
}

export function GestionnaireDemandesManagedStatsHeader({
  totalLeads,
  newLeadsCount,
  contactedLeadsCount,
  convertedLeadsCount,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Demandes */}
      <div
        className="rounded-card border shadow-2xs p-5 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            Demandes Reçues
          </span>
          <div
            className="w-9 h-9 rounded-pill flex items-center justify-center"
            style={{ background: 'var(--forest-50)', color: 'var(--forest-700)' }}
          >
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p
            className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums"
            style={{ color: 'var(--forest-900)' }}
          >
            {totalLeads} <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>prospects</span>
          </p>
          <p className="text-[0.7rem] font-medium mt-1" style={{ color: 'var(--foreground-muted)' }}>
            Bailleurs intéressés par Klef Managed
          </p>
        </div>
      </div>

      {/* 2. Nouveaux Prospects À Contacter */}
      <div
        className="rounded-card border shadow-2xs p-5 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            À Contacter (Nouveaux)
          </span>
          <div
            className="w-9 h-9 rounded-pill flex items-center justify-center"
            style={{
              background: newLeadsCount > 0 ? 'var(--warning-50)' : 'var(--forest-50)',
              color: newLeadsCount > 0 ? 'var(--warning-700)' : 'var(--forest-700)',
              border: `1px solid ${newLeadsCount > 0 ? 'var(--warning-500)' : 'var(--forest-200)'}`,
            }}
          >
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p
            className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums"
            style={{ color: newLeadsCount > 0 ? 'var(--warning-700)' : 'var(--forest-900)' }}
          >
            {newLeadsCount} <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>nouveau{newLeadsCount > 1 ? 'x' : ''}</span>
          </p>
          <p className="text-[0.7rem] font-medium mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {newLeadsCount > 0 ? 'Action requise : appel / WhatsApp' : 'Tous les prospects ont été contactés'}
          </p>
        </div>
      </div>

      {/* 3. Prospects En cours de discussion */}
      <div
        className="rounded-card border shadow-2xs p-5 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            En Cours de Échange
          </span>
          <div
            className="w-9 h-9 rounded-pill flex items-center justify-center"
            style={{ background: 'var(--gold-50)', color: 'var(--gold-800)', border: '1px solid var(--gold-200)' }}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p
            className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums"
            style={{ color: 'var(--forest-900)' }}
          >
            {contactedLeadsCount} <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>en cours</span>
          </p>
          <p className="text-[0.7rem] font-medium mt-1" style={{ color: 'var(--foreground-muted)' }}>
            Présentation du mandat conciergerie
          </p>
        </div>
      </div>

      {/* 4. Convertis en Bailleurs Partenaires */}
      <div
        className="rounded-card border shadow-2xs p-5 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            Convertis sous Mandat
          </span>
          <div
            className="w-9 h-9 rounded-pill flex items-center justify-center shadow-2xs"
            style={{ background: 'var(--forest-950)', color: 'var(--lime-400)' }}
          >
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p
            className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums"
            style={{ color: 'var(--forest-900)' }}
          >
            {convertedLeadsCount} <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>bailleurs</span>
          </p>
          <p className="text-[0.7rem] font-medium mt-1 flex items-center gap-1" style={{ color: 'var(--success-700)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Convertis en comptes bailleurs</span>
          </p>
        </div>
      </div>
    </div>
  );
}
