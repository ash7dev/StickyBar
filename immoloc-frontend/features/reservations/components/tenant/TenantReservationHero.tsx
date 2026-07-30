'use client';

import Image from 'next/image';
import { Moon, Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fcfa, dateLong } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

const STATUT_CFG: Record<string, {
  label: string;
  badge: string;
  dot: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  PENDING:    { label: 'En attente',      badge: 'bg-warning-50/20 text-warning-400 border-warning-400/30', dot: 'bg-warning-400', Icon: Clock },
  PAID:       { label: 'Sous séquestre',  badge: 'bg-forest-900/90 text-lime-300 border-lime-400/30',       dot: 'bg-lime-400',    Icon: ShieldCheck },
  CONFIRMED:  { label: 'Confirmée',       badge: 'bg-forest-900/90 text-lime-300 border-lime-400/30',       dot: 'bg-lime-400',    Icon: CheckCircle2 },
  CHECKED_IN: { label: 'Séjour en cours', badge: 'bg-forest-900/90 text-lime-300 border-lime-400/30 ring-1 ring-lime-400/50', dot: 'bg-lime-400', Icon: CheckCircle2 },
  COMPLETED:  { label: 'Terminée',        badge: 'bg-neutral-800/60 text-neutral-300 border-neutral-700/50', dot: 'bg-neutral-400', Icon: CheckCircle2 },
  CANCELLED:  { label: 'Annulée',         badge: 'bg-error-500/20 text-error-400 border-error-500/30',       dot: 'bg-error-400',   Icon: AlertTriangle },
  DISPUTED:   { label: 'Litige',          badge: 'bg-error-500/20 text-error-400 border-error-500/30',       dot: 'bg-error-400',   Icon: AlertTriangle },
  EXPIRED:    { label: 'Expirée',         badge: 'bg-neutral-800/60 text-neutral-400 border-neutral-700/50', dot: 'bg-neutral-400', Icon: Clock },
};

export function TenantReservationHero({ res }: { res: ReservationDetail }) {
  const cfg = STATUT_CFG[res.statut] ?? STATUT_CFG.PENDING;
  const { Icon } = cfg;
  const mainPhoto = res.logement.photos.find((p) => p.estPrincipale)?.url ?? res.logement.photos[0]?.url;

  return (
    <div className="relative rounded-card border border-forest-800/90 bg-gradient-to-b from-forest-950 via-[#072A20] to-forest-950 p-6 md:p-8 shadow-2xl overflow-hidden text-white">
      {/* Halos de fond */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-lime-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-forest-600/20 blur-3xl" />

      <div className="relative flex flex-col md:flex-row md:items-start gap-6">

        {/* Colonne Gauche */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border text-xs font-bold backdrop-blur-md',
              cfg.badge,
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', cfg.dot)} />
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </span>
            <span className="text-xs text-forest-300/80 font-medium">
              Créée le {dateLong(res.creeLe)}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-300 mb-1">
              {res.logement.type} · {res.logement.ville}
              {res.logement.quartier ? ` · ${res.logement.quartier}` : ''}
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">
              {res.logement.titre}
            </h1>
          </div>

          {/* Widget Dates Box */}
          <div className="flex items-stretch bg-forest-900/60 border border-forest-800/80 rounded-inner overflow-hidden w-full max-w-sm backdrop-blur-md">
            <div className="flex-1 px-4 py-3 text-center">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-forest-300 mb-1">Arrivée</p>
              <p className="text-sm font-bold text-white">{dateLong(res.dateDebut)}</p>
              {res.confirmeeLe && (
                <p className="text-[10px] font-semibold text-lime-300 mt-1 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-lime-400" />
                  {new Date(res.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center px-4 border-x border-forest-800/80 bg-forest-950/40">
              <Moon className="w-4 h-4 text-lime-400" />
              <span className="text-base font-extrabold text-white tabular-nums leading-none mt-0.5">{res.nbNuits}</span>
              <span className="text-[8px] font-bold text-forest-300 uppercase">nuit{res.nbNuits > 1 ? 's' : ''}</span>
            </div>

            <div className="flex-1 px-4 py-3 text-center">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-forest-300 mb-1">Départ</p>
              <p className="text-sm font-bold text-white">{dateLong(res.dateFin)}</p>
              {res.confirmeeLe && (
                <p className="text-[10px] font-semibold text-forest-300 mt-1 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(res.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-forest-200">
            <Users className="w-4 h-4 text-lime-400" />
            <span>{res.nbPersonnes} voyageur{res.nbPersonnes > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Colonne Droite : Photo & Total Réglé */}
        <div className="flex flex-col gap-3 md:w-56 shrink-0">
          {mainPhoto && (
            <div className="relative w-full h-36 md:h-40 rounded-inner overflow-hidden border border-forest-800 bg-forest-950">
              <Image src={mainPhoto} alt={res.logement.titre} fill className="object-cover" />
            </div>
          )}

          <div className="rounded-inner bg-forest-900/80 border border-forest-800/80 p-4 text-center backdrop-blur-md space-y-1">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-forest-200">Total Réglé (Séquestre)</p>
            <p className="font-display text-2xl font-extrabold text-lime-400 leading-none">{fcfa(res.totalLocataire)}</p>
            <p className="text-[10px] font-bold text-lime-200">FCFA</p>
          </div>
        </div>

      </div>
    </div>
  );
}
