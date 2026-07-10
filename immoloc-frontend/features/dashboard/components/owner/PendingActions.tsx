'use client';

import { AlertCircle, Clock, ArrowRight, Zap, ShieldAlert, CalendarClock, Activity } from 'lucide-react';
import Link from 'next/link';

interface Props {
  confirmations: number;
  disputes: number;
  recentBookings?: Array<{
    id: string;
    statut: string;
    logement: { titre: string };
    locataire: { prenom: string; nom: string };
    dateFin: string;
  }>;
}

export function PendingActions({ confirmations, disputes, recentBookings = [] }: Props) {
  const total = confirmations + disputes;
  const urgent = disputes;
  const toHandle = confirmations;
  const checkedInBookings = recentBookings.filter(b => b.statut === 'CHECKED_IN');

  const hasUrgent = urgent > 0;

  return (
    <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/[0.06] h-full min-h-[420px] flex flex-col group/card hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-500 relative overflow-hidden">
      
      {/* ── Ambient Background Glow ──────────────────────────────── */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/8 rounded-full blur-[80px] pointer-events-none" />
      {hasUrgent && (
        <div className="absolute top-0 left-0 w-48 h-48 bg-rose-500/8 rounded-full blur-[60px] pointer-events-none" />
      )}
      
      {/* ── Grid pattern overlay ────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border
              ${hasUrgent 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-primary-500/10 border-primary-500/20 text-primary-400'}`}>
              <Zap className="w-[18px] h-[18px]" />
            </div>
            {total > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                  ${hasUrgent ? 'bg-rose-400' : 'bg-primary-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-[#0a0a0a]
                  ${hasUrgent ? 'bg-rose-500' : 'bg-primary-500'}`}></span>
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">À faire</p>
            <h3 className="text-sm font-bold text-white">Actions requises</h3>
          </div>
        </div>
        
        {total > 0 && (
          <Link href="/dashboard/reservations" 
            className="px-3 py-1.5 rounded-lg bg-background-card/[0.04] hover:bg-background-card/[0.08] text-[10px] font-bold text-white/60 hover:text-white border border-white/[0.06] transition-colors flex items-center gap-1.5">
            Voir tout
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* ── Stats Summary ───────────────────────────────────────── */}
      <div className="relative z-10 grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl border bg-background-card/[0.02] border-white/[0.06] shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Urgents</span>
          </div>
          <p className="text-2xl font-black text-white">{urgent}</p>
        </div>
        
        <div className="p-4 rounded-xl border bg-background-card/[0.02] border-white/[0.06] shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">À traiter</span>
          </div>
          <p className="text-2xl font-black text-white">{toHandle}</p>
        </div>
      </div>

      {/* ── Action List ─────────────────────────────────────────── */}
      <div className="relative z-10 space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        
        {/* Litiges (Urgents) */}
        {disputes > 0 && (
          <Link href="/dashboard/litiges" 
            className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30 hover:shadow-md hover:shadow-rose-500/5 hover:-translate-y-0.5 transition-all group">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-[18px] h-[18px]" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-bold text-white mb-0.5">
                {disputes} litige{disputes > 1 ? 's' : ''} en attente
              </p>
              <p className="text-[10px] font-medium text-rose-400/80">Réponse requise immédiatement</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-background-card/5 flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-500 group-hover:border-rose-500 transition-colors mt-1 shrink-0">
              <ArrowRight className="w-3 h-3 text-rose-400 group-hover:text-white" />
            </div>
          </Link>
        )}

        {/* Confirmations */}
        {confirmations > 0 && (
          <Link href="/dashboard/reservations?statut=PENDING" 
            className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-background-card/[0.02] hover:bg-background-card/[0.06] hover:border-white/[0.1] hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="w-9 h-9 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Activity className="w-[18px] h-[18px]" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-bold text-white mb-0.5">
                {confirmations} réservation{confirmations > 1 ? 's' : ''} à confirmer
              </p>
              <p className="text-[10px] font-medium text-white/40">Accepter les demandes payées</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-background-card/[0.06] flex items-center justify-center border border-white/[0.06] group-hover:bg-primary-500 group-hover:border-primary-500 transition-colors mt-1 shrink-0">
              <ArrowRight className="w-3 h-3 text-white/40 group-hover:text-white" />
            </div>
          </Link>
        )}

        {/* Checked-In Bookings */}
        {checkedInBookings.map(b => (
          <Link key={b.id} href={`/dashboard/reservations/${b.id}`} 
            className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-background-card/[0.02] hover:bg-background-card/[0.06] hover:border-white/[0.1] hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Clock className="w-[18px] h-[18px]" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-bold text-white truncate mb-0.5">
                {b.logement.titre}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                En cours • Fin le {new Date(b.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-background-card/[0.06] flex items-center justify-center border border-white/[0.06] group-hover:bg-background-card group-hover:border-white transition-colors mt-1 shrink-0">
              <ArrowRight className="w-3 h-3 text-white/40 group-hover:text-black" />
            </div>
          </Link>
        ))}

        {/* Empty State */}
        {total === 0 && checkedInBookings.length === 0 && (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-background-card/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-xs font-bold text-white">Tout est à jour</p>
            <p className="text-[10px] text-white/40 mt-1">Aucune action requise pour le moment.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
