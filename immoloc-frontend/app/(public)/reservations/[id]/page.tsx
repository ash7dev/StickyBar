'use client';

import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationDetail } from '@/lib/nestjs/types';

import { TenantReservationSkeleton }  from '@/features/reservations/components/tenant/TenantReservationSkeleton';
import { TenantReservationHero }      from '@/features/reservations/components/tenant/TenantReservationHero';
import { TenantHostCard }             from '@/features/reservations/components/tenant/TenantHostCard';
import { TenantPropertyCard }         from '@/features/reservations/components/tenant/TenantPropertyCard';
import { TenantFinancialCard }        from '@/features/reservations/components/tenant/TenantFinancialCard';
import { TenantReservationActionPanel } from '@/features/reservations/components/tenant/TenantReservationActionPanel';
import { CheckInTimeCard }            from '@/features/reservations/components/tenant/CheckInTimeCard';
import { ReservationPaymentCard }     from '@/features/reservations/components/shared/ReservationPaymentCard';
import { ReservationPhotos }          from '@/features/reservations/components/shared/ReservationPhotos';
import { ReservationLitige }          from '@/features/reservations/components/shared/ReservationLitige';
import { ReservationTimeline }        from '@/features/reservations/components/shared/ReservationTimeline';
import { GlassCard }                  from '@/features/reservations/components/shared/reservation-cards';

export default function TenantReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: res, isLoading, error } = useQuery<ReservationDetail>({
    queryKey: ['reservation', id],
    queryFn:  () => nestFetch<ReservationDetail>(NEST_API.RESERVATIONS.FIND_ONE(id)),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const onRefetch = () => queryClient.invalidateQueries({ queryKey: ['reservation', id] });

  if (isLoading) return <TenantReservationSkeleton />;

  if (error || !res) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-start gap-3 bg-error-50 border border-error-200 rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
          <p className="text-sm text-error-700 font-medium">Impossible de charger cette réservation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-16 space-y-4">

      {/* Retour + ID */}
      <div className="flex items-center justify-between">
        <Link
          href="/reservations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors group"
        >
          <span className="w-7 h-7 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          Mes réservations
        </Link>
        <span className="text-[10px] font-mono font-bold text-foreground-muted bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-xl tracking-wider">
          #{res.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Hero */}
      <TenantReservationHero res={res} />

      {/* Card horaires (uniquement si confirmé) */}
      <CheckInTimeCard res={res} />

      {/* Actions locataire (contextuel — uniquement CONFIRMED) */}
      <TenantReservationActionPanel id={id} res={res} onRefetch={onRefetch} />

      {/* Contrat */}
      <GlassCard>
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Contrat de location</p>
              <p className="text-xs text-foreground-muted">Généré automatiquement · Signé numériquement</p>
            </div>
          </div>
          <Link
            href={`/reservations/${id}/contrat`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl transition-colors shadow-sm border border-white/8"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Consulter
          </Link>
        </div>
      </GlassCard>

      {/* Hôte + Logement */}
      <div className="grid md:grid-cols-2 gap-4">
        <TenantHostCard proprietaire={res.proprietaire} statut={res.statut} dateDebut={res.dateDebut} />
        <TenantPropertyCard logement={res.logement} />
      </div>

      {/* Récapitulatif financier */}
      <TenantFinancialCard
        nbNuits={res.nbNuits}
        nbPersonnes={res.nbPersonnes}
        dateDebut={res.dateDebut}
        dateFin={res.dateFin}
        totalLocataire={res.totalLocataire}
      />

      {/* Paiement */}
      <ReservationPaymentCard paiement={res.paiement} />

      {/* Photos état des lieux */}
      <ReservationPhotos photosEtatLieu={res.photosEtatLieu} />

      {/* Litige */}
      <ReservationLitige litige={res.litige} />

      {/* Chronologie */}
      <ReservationTimeline historique={res.historique} />

    </div>
  );
}
