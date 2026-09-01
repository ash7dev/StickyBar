'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { GestionnaireProprietairesStatsHeader } from '@/features/gestionnaire/components/GestionnaireProprietairesStatsHeader';
import { GestionnaireProprietairesSearchFilterBar, OwnerSearchFilterOptions } from '@/features/gestionnaire/components/GestionnaireProprietairesSearchFilterBar';
import { GestionnaireOwnerCardWithListings, OwnerWithListings } from '@/features/gestionnaire/components/GestionnaireOwnerCardWithListings';
import { Users, Wallet, AlertCircle, RefreshCw, CheckCircle2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

export default function GestionnaireProprietairesPage() {
  const [filters, setFilters] = useState<OwnerSearchFilterOptions>({
    searchQuery: '',
    balanceFilter: 'ALL',
  });

  const [selectedOwner, setSelectedOwner] = useState<OwnerWithListings | null>(null);
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState<'WAVE' | 'ORANGE_MONEY'>('WAVE');
  const [telephonePay, setTelephonePay] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const queryClient = useQueryClient();

  // Données réelles depuis le serveur NestJS
  const {
    data: owners,
    isLoading,
    error,
    refetch,
  } = useQuery<OwnerWithListings[]>({
    queryKey: ['gestionnaire', 'proprietaires'],
    queryFn: () => nestFetch<OwnerWithListings[]>(NEST_API.GESTIONNAIRE.PROPRIETAIRES),
  });

  const handleFilterChange = (updated: Partial<OwnerSearchFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  // Filtrage combiné
  const filteredOwners = useMemo(() => {
    const all = owners ?? [];
    let result = [...all];

    if (filters.balanceFilter === 'HAS_BALANCE') {
      result = result.filter((o) => o.soldeDisponible > 0);
    } else if (filters.balanceFilter === 'ZERO_BALANCE') {
      result = result.filter((o) => o.soldeDisponible <= 0);
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const fullName = `${o.prenom} ${o.nom}`.toLowerCase();
        const phoneMatch = (o.telephone || '').toLowerCase().includes(q);
        const emailMatch = (o.email || '').toLowerCase().includes(q);
        return fullName.includes(q) || phoneMatch || emailMatch;
      });
    }

    return result;
  }, [owners, filters]);

  const hasBalanceCount = useMemo(() => {
    return (owners ?? []).filter((o) => o.soldeDisponible > 0).length;
  }, [owners]);

  const openModal = (owner: OwnerWithListings) => {
    setSelectedOwner(owner);
    setTelephonePay(owner.telephone || '');
    setMontant(owner.soldeDisponible > 0 ? String(owner.soldeDisponible) : '');
    setFeedback(null);
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      await nestFetch(`/api/v1/gestionnaire/proprietaires/${selectedOwner.id}/retrait`, {
        method: 'POST',
        body: JSON.stringify({
          montant: Number(montant),
          methode,
          telephoneMobileMoney: telephonePay,
        }),
      });

      setFeedback({
        type: 'success',
        message: `Demande de reversement de ${fcfa(Number(montant))} FCFA transmise pour ${selectedOwner.prenom} ${selectedOwner.nom}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['gestionnaire', 'proprietaires'] });
      setTimeout(() => setSelectedOwner(null), 2000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Impossible d’initier le reversement. Vérifiez le solde du propriétaire.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Propriétaires Partenaires & Mandats
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
            Gérez les bailleurs sous votre conciergerie, consultez leurs logements attribués et déclenchez les virements Mobile Money.
          </p>
        </div>

        <Link
          href="/gestionnaire/annonces/nouvelle"
          className="btn-action inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold self-start sm:self-auto cursor-pointer"
        >
          <Building2 className="h-4 w-4" aria-hidden="true" />
          <span>Créer un bien sous mandat</span>
        </Link>
      </div>

      {/* ── Bannière KPI Propriétaires ─────────────────────────────────────── */}
      {owners && <GestionnaireProprietairesStatsHeader owners={owners} />}

      {/* ── Barre de filtre et de recherche ─────────────────────────────────── */}
      {owners && (
        <GestionnaireProprietairesSearchFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          totalCount={owners.length}
          hasBalanceCount={hasBalanceCount}
        />
      )}

      {/* ── Erreur ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-card border border-error-500/20 bg-error-50 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-error-700 font-medium">
            <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
            <span>Impossible de charger la liste des propriétaires partenaires.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-error-600 text-white text-xs font-semibold hover:bg-error-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      )}

      {/* ── Chargement Skeleton ────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-4 animate-pulse" aria-busy="true">
          <div className="h-48 rounded-card bg-neutral-100" />
          <div className="h-48 rounded-card bg-neutral-100" />
        </div>
      )}

      {/* ── État vide ─────────────────────────────────────────────────────── */}
      {!isLoading && !error && filteredOwners.length === 0 && (
        <div className="rounded-card border border-dashed border-border bg-background-card p-16 text-center shadow-xs space-y-4 min-h-[320px] flex flex-col items-center justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-inner bg-forest-50 text-forest-700 mx-auto">
            <Users className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-foreground">
            {filters.searchQuery || filters.balanceFilter !== 'ALL'
              ? 'Aucun propriétaire ne correspond à vos critères'
              : 'Aucun propriétaire partenaire rattaché pour le moment'}
          </p>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
            {filters.searchQuery || filters.balanceFilter !== 'ALL'
              ? 'Essayez de réinitialiser la recherche ou de sélectionner un autre filtre de solde.'
              : 'Les propriétaires partenaires rattachés à votre conciergerie s’afficheront automatiquement dès la création d’une annonce sous mandat.'}
          </p>
          {filters.searchQuery || filters.balanceFilter !== 'ALL' ? (
            <button
              type="button"
              onClick={() => setFilters({ searchQuery: '', balanceFilter: 'ALL' })}
              className="inline-flex items-center justify-center px-4 py-2 rounded-pill bg-neutral-100 text-foreground text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Réinitialiser la recherche
            </button>
          ) : (
            <Link
              href="/gestionnaire/annonces/nouvelle"
              className="btn-action inline-flex items-center justify-center gap-2 mt-2 px-5 py-2.5 text-xs sm:text-sm font-semibold"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>Publier un premier bien sous mandat</span>
            </Link>
          )}
        </div>
      )}

      {/* ── Cartes Structurées par Propriétaire avec Logements Dépliables ─── */}
      {!isLoading && !error && filteredOwners.length > 0 && (
        <div className="space-y-5">
          {filteredOwners.map((owner) => (
            <GestionnaireOwnerCardWithListings
              key={owner.id}
              owner={owner}
              onOpenWithdrawal={openModal}
            />
          ))}
        </div>
      )}

      {/* Modal de demande de reversement */}
      {selectedOwner && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-card border border-border bg-background-card p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">
                Reversement pour {selectedOwner.prenom} {selectedOwner.nom}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOwner(null)}
                className="text-xs font-bold text-foreground-muted hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-inner bg-forest-50 border border-forest-200 text-xs sm:text-sm text-forest-900 flex items-center justify-between font-medium">
              <span>Solde actuellement disponible :</span>
              <span className="font-bold tabular-nums">{fcfa(selectedOwner.soldeDisponible)} FCFA</span>
            </div>

            {feedback && (
              <div
                className={cn(
                  'p-3.5 rounded-inner text-xs flex items-center gap-2 font-medium',
                  feedback.type === 'success' ? 'bg-success-50 text-success-700 border border-success-500/20' : 'bg-error-50 text-error-700 border border-error-500/20',
                )}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawal} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-foreground mb-1.5">Montant à reverser (FCFA)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={selectedOwner.soldeDisponible}
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Ex: 150000"
                  className="w-full rounded-field border border-border bg-background-card p-3 text-sm font-semibold text-foreground focus:border-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1.5">Moyen de paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['WAVE', 'ORANGE_MONEY'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethode(m)}
                      className={cn(
                        'p-3 rounded-pill border text-xs font-semibold transition-all duration-150 cursor-pointer text-center',
                        methode === m ? 'border-forest-700 bg-forest-900 text-neutral-0 shadow-xs' : 'border-border bg-background-alt text-foreground hover:bg-neutral-100',
                      )}
                    >
                      {m === 'WAVE' ? '🌊 Wave' : '🍊 Orange Money'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1.5">Numéro Mobile Money du propriétaire</label>
                <input
                  type="text"
                  required
                  value={telephonePay}
                  onChange={(e) => setTelephonePay(e.target.value)}
                  placeholder="+221 77 XXX XX XX"
                  className="w-full rounded-field border border-border bg-background-card p-3 text-sm text-foreground focus:border-forest-600 focus:outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedOwner(null)}
                  className="px-4.5 py-2.5 rounded-pill border border-border text-xs font-semibold text-foreground hover:bg-background-alt"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-action px-5 py-2.5 text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Traitement...' : 'Confirmer le virement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
