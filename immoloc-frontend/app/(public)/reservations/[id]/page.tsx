'use client';

import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationDetail } from '@/lib/nestjs/types';

import { TenantReservationsGuard }     from '@/features/reservations/components/tenant/TenantReservationsGuard';
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
import { AskAssistantButton }         from '@/components/assistant/AskAssistantButton';

function TenantReservationDetailContent({ id }: { id: string }) {
  const queryClient = useQueryClient();

  const { data: res, isLoading, error } = useQuery<ReservationDetail>({
    queryKey: ['reservation', id],
    queryFn:  () => nestFetch<ReservationDetail>(NEST_API.RESERVATIONS.FIND_ONE(id)),
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  const onRefetch = () => queryClient.invalidateQueries({ queryKey: ['reservation', id] });

  if (isLoading) return <TenantReservationSkeleton />;

  if (error || !res) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-card p-6 text-center space-y-3 max-w-md mx-auto my-8">
        <div className="w-12 h-12 rounded-inner bg-error-100 flex items-center justify-center mx-auto text-error-700">
          <AlertTriangle className="w-6 h-6 text-error-600" />
        </div>
        <p className="text-sm text-error-800 font-bold">Impossible de charger cette réservation.</p>
        <Link
          href="/reservations"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-forest-900 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à mes séjours</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Retour + Réf */}
      <div className="flex items-center justify-between">
        <Link
          href="/reservations"
          className="inline-flex items-center gap-2 text-xs font-bold text-foreground-muted hover:text-forest-950 transition-colors group"
        >
          <span className="w-8 h-8 rounded-inner bg-background-alt border border-border flex items-center justify-center group-hover:border-forest-300 transition-colors">
            <ArrowLeft className="w-4 h-4 text-forest-700" />
          </span>
          <span>Retour aux séjours</span>
        </Link>

        <span className="text-[11px] font-mono font-bold text-foreground-faint bg-background-alt border border-border/80 px-3.5 py-1.5 rounded-pill tracking-wider">
          RÉF: #{res.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Hero Principal avec Lime accents */}
      <TenantReservationHero res={res} />

      {/* Card Horaires */}
      <CheckInTimeCard res={res} />

      {/* Actions locataire */}
      <TenantReservationActionPanel id={id} res={res} onRefetch={onRefetch} />

      {/* Contrat de Location Klef */}
      <div className="bg-forest-950 text-white rounded-card p-5 border border-forest-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-inner bg-forest-900 border border-forest-800 flex items-center justify-center text-on-inverse-marker shrink-0">
            <FileText className="w-5 h-5 text-on-inverse-marker" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-white">Contrat de location vérifié</p>
            <p className="text-xs text-forest-300">Généré automatiquement par Klef · Horodaté & Signé numériquement</p>
          </div>
        </div>

        <Link
          href={`/reservations/${id}/contrat`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-action hover:bg-action-hover text-on-action font-extrabold text-xs shadow-md transition-all active:scale-95"
        >
          <ExternalLink className="w-4 h-4 text-forest-950" />
          <span>Consulter le Contrat PDF</span>
        </Link>
      </div>

      {/* Grille Hôte + Logement */}
      <div className="grid md:grid-cols-2 gap-5">
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
      <ReservationPaymentCard paiement={res.paiement} reservation={res} />

      {/* Photos état des lieux */}
      <ReservationPhotos photosEtatLieu={res.photosEtatLieu} />

      {/* Litige */}
      <ReservationLitige litige={res.litige} />

      {/* Assistance Klef */}
      <div className="rounded-card border border-forest-800/20 bg-background-card p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="font-display text-sm font-bold text-foreground">Une question ou besoin d&apos;assistance sur ce séjour ?</h4>
          <p className="text-xs text-foreground-muted">L&apos;assistant Klef et nos équipes vous accompagnent en direct 24h/24 et 7j/7.</p>
        </div>
        <AskAssistantButton
          label="Demander à l'assistant"
          subject={`Assistance sur la réservation #${res.id.slice(0, 8).toUpperCase()}`}
          category="RESERVATION"
          reservationId={res.id}
          variant="lime"
        />
      </div>

      {/* Chronologie */}
      <ReservationTimeline historique={res.historique} />
    </div>
  );
}

export default function TenantReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <TenantReservationsGuard>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-12 pb-24">
        <TenantReservationDetailContent id={id} />
      </div>
    </TenantReservationsGuard>
  );
}
