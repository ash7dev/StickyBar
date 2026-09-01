'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Building2, Plus, Edit3, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

interface ListingPreview {
  id: string;
  titre: string;
  ville: string;
  type: string;
  prixBase: number;
  statut: string;
  photoUrl?: string | null;
  ownerName: string;
}

interface Props {
  listings: ListingPreview[];
}

const STATUT_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PUBLISHED: { label: 'Publiée', cls: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
  PENDING_REVIEW: { label: 'En révision', cls: 'bg-warning-50 text-warning-700', dot: 'bg-warning-500' },
  DRAFT: { label: 'Brouillon', cls: 'bg-neutral-100 text-foreground-muted', dot: 'bg-neutral-400' },
  PAUSED: { label: 'En pause', cls: 'bg-neutral-100 text-foreground-muted', dot: 'bg-neutral-400' },
};

export function GestionnaireManagedListingsPreview({ listings }: Props) {
  return (
    <div className="rounded-card border border-border bg-background-card p-7 sm:p-8 shadow-2xs space-y-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2.5">
              <Building2 className="h-6 w-6 text-forest-600" aria-hidden="true" />
              <span>Biens sous Votre Gestion Conciergerie</span>
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
              Accès rapide à l&apos;édition des logements gérés sous votre conciergerie
            </p>
          </div>

          <Link
            href="/gestionnaire/annonces"
            className="text-xs font-semibold text-forest-600 hover:text-forest-700 hover:underline"
          >
            Voir tout ({listings.length}) →
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="grid h-12 w-12 place-items-center rounded-inner bg-forest-50 text-forest-700 mx-auto">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-foreground">Aucun bien géré pour le moment</p>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
              Commencez par ajouter votre premier logement conciergerie pour un propriétaire partenaire.
            </p>
            <Link
              href="/gestionnaire/annonces/nouvelle"
              className="btn-action inline-flex items-center justify-center gap-2 mt-3 px-5 py-2.5 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Publier un premier bien</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {listings.map((l) => {
              const cfg = STATUT_CONFIG[l.statut] ?? STATUT_CONFIG.DRAFT;

              return (
                <div
                  key={l.id}
                  className="flex items-center gap-3.5 p-3.5 rounded-inner border border-border bg-background-alt hover:border-forest-600/30 transition-all duration-200"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-inner bg-neutral-100">
                    {l.photoUrl ? (
                      <Image src={l.photoUrl} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-neutral-300">
                        <ImageOff className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[0.625rem] font-semibold', cfg.cls)}>
                        <span className={cn('h-1.5 w-1.5 rounded-pill', cfg.dot)} />
                        {cfg.label}
                      </span>
                      <span className="text-[0.625rem] text-foreground-muted font-medium truncate">
                        {l.ownerName}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-foreground truncate">
                      {l.titre}
                    </p>

                    <p className="text-[0.6875rem] text-foreground-muted font-medium">
                      {fcfa(l.prixBase)} FCFA/nuit · {l.ville}
                    </p>
                  </div>

                  <Link
                    href={`/gestionnaire/annonces/${l.id}/modifier`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-background-card border border-border text-foreground hover:bg-neutral-100 transition-colors"
                    title="Modifier ce bien"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-forest-700" aria-hidden="true" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
