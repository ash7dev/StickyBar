'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Phone, Mail, Wallet, Edit3, ImageOff, Building2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { OwnerListingCard } from '@/features/listings/components/owner/OwnerListingCard';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

export interface OwnerListingDetail {
  id: string;
  titre: string;
  ville: string;
  type?: string;
  statut?: string;
  prixBase?: number;
  photos?: Array<{ url: string }>;
}

export interface OwnerWithListings {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  logementsCount: number;
  soldeDisponible: number;
  logements?: OwnerListingDetail[];
}

interface Props {
  owner: OwnerWithListings;
  onOpenWithdrawal: (owner: OwnerWithListings) => void;
  onOpenReleve?: (owner: OwnerWithListings) => void;
}

const STATUT_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PUBLISHED: { label: 'Publiée', cls: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
  PENDING_REVIEW: { label: 'En révision', cls: 'bg-warning-50 text-warning-700', dot: 'bg-warning-500' },
  DRAFT: { label: 'Brouillon', cls: 'bg-neutral-100 text-foreground-muted', dot: 'bg-neutral-400' },
  PAUSED: { label: 'En pause', cls: 'bg-neutral-100 text-foreground-muted', dot: 'bg-neutral-400' },
};

export function GestionnaireOwnerCardWithListings({ owner, onOpenWithdrawal, onOpenReleve }: Props) {
  const [expanded, setExpanded] = useState(true);
  const listings = owner.logements ?? [];

  return (
    <div className="rounded-card border border-border bg-background-card p-6 sm:p-7 shadow-2xs space-y-5 transition-all hover:border-forest-600/30">
      {/* ── En-tête du Propriétaire ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-border pb-5">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-inner bg-forest-900 text-lime-400 font-bold text-base shadow-xs">
            {owner.prenom[0]}{owner.nom[0]}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {owner.prenom} {owner.nom}
              </h3>
              <span className="inline-flex items-center px-3 py-1 rounded-pill text-xs font-semibold bg-forest-50 text-forest-700 border border-forest-200">
                Mandat Conciergerie Actif
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-foreground-muted pt-0.5">
              <a
                href={`tel:${owner.telephone}`}
                className="flex items-center gap-1.5 text-foreground hover:text-forest-600 font-semibold transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-forest-600 shrink-0" aria-hidden="true" />
                <span>{owner.telephone}</span>
              </a>

              {owner.email && (
                <a
                  href={`mailto:${owner.email}`}
                  className="flex items-center gap-1.5 text-foreground-muted hover:text-foreground truncate max-w-[220px]"
                >
                  <Mail className="h-3.5 w-3.5 text-foreground-faint shrink-0" aria-hidden="true" />
                  <span>{owner.email}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Portefeuille & Action Virement */}
        <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
          <div className="text-left md:text-right mr-2">
            <span className="text-[0.6875rem] uppercase font-bold text-foreground-muted tracking-wider block">
              Solde Portefeuille Disponible
            </span>
            <span className="font-display text-xl font-semibold text-forest-950 tabular-nums">
              {fcfa(owner.soldeDisponible)} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenReleve?.(owner)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-pill border border-border bg-background-card hover:bg-neutral-100 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-xs"
          >
            <FileText className="h-4 w-4 text-forest-600" aria-hidden="true" />
            <span>📄 Relevé Mensuel</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenWithdrawal(owner)}
            className="btn-action inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold cursor-pointer"
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            <span>Reverser Mobile Money</span>
          </button>
        </div>
      </div>

      {/* ── Entête Accordéon Logements ────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-forest-600 transition-colors cursor-pointer"
        >
          <Building2 className="h-4 w-4 text-forest-600" aria-hidden="true" />
          <span>
            {listings.length} bien{listings.length > 1 ? 's' : ''} géré{listings.length > 1 ? 's' : ''} sous mandat
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
          )}
        </button>

        <Link
          href={`/gestionnaire/annonces/nouvelle?ownerId=${owner.id}`}
          className="text-xs font-semibold text-forest-600 hover:text-forest-700 hover:underline"
        >
          + Ajouter un bien pour ce bailleur
        </Link>
      </div>

      {/* ── Contenu Accordéon : Grille des Logements sous Mandat ─────────── */}
      {expanded && (
        <div className="pt-2 animate-in fade-in duration-200">
          {listings.length === 0 ? (
            <p className="text-xs text-foreground-muted italic py-3">
              Aucun bien actuellement associé à ce propriétaire.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((l) => (
                <OwnerListingCard
                  key={l.id}
                  listing={{
                    id: l.id,
                    titre: l.titre,
                    ville: l.ville,
                    statut: l.statut || 'DRAFT',
                    prixBase: l.prixBase,
                    typeLogement: l.type,
                    photos: l.photos,
                  }}
                  viewMode="list"
                  isGestionnaire={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
