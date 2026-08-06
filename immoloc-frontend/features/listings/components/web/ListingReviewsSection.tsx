'use client';

import Image from 'next/image';
import { Star, ShieldCheck, MessageSquare } from 'lucide-react';
import type { Listing } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface ListingReviewsSectionProps {
  listing: Listing;
  className?: string;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

export function ListingReviewsSection({ listing, className }: ListingReviewsSectionProps) {
  const avisList = listing.avis ?? [];
  const note = Number(listing.note);
  const totalAvis = listing.totalAvis ?? avisList.length;
  const noteMoyenne = totalAvis > 0 && note > 0 ? note.toFixed(1) : null;

  return (
    <section className={cn('space-y-5 border-t border-border pt-6', className)}>

      {/* ── En-tête ──────────────────────────────────────────────────────── */}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Avis des voyageurs
            </h2>
            <span className="inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2 py-0.5 text-[11px] font-semibold text-gold-700">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Séjours vérifiés
            </span>
          </div>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Commentaires laissés par les voyageurs après leur séjour.
          </p>
        </div>

        {noteMoyenne && totalAvis > 0 && (
          <div className="flex items-center gap-2.5 rounded-pill border border-border bg-background-alt px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" aria-hidden="true" />
              <span className="font-display text-sm font-bold tabular-nums text-foreground">
                {noteMoyenne}
              </span>
              <span className="text-[11px] text-foreground-muted">/ 5</span>
            </div>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
            <span className="text-xs font-medium text-foreground-muted tabular-nums">
              {totalAvis} avis
            </span>
          </div>
        )}
      </header>

      {/* ── Liste ────────────────────────────────────────────────────────── */}

      {avisList.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {avisList.map((rev) => {
            /* `${prenom ?? ''} ${nom[0]}.` produisait « . » tout seul quand le
               prénom manquait mais pas le nom. */
            const authorName =
              [rev.auteur.prenom, rev.auteur.nom ? `${rev.auteur.nom[0]}.` : null]
                .filter(Boolean).join(' ') || 'Voyageur';
            const initials =
              `${rev.auteur.prenom?.[0] ?? ''}${rev.auteur.nom?.[0] ?? ''}`.toUpperCase() || 'V';
            const dateStr = fmtDate(rev.creeLe);

            return (
              <li
                key={rev.id}
                className="flex flex-col justify-between gap-3 rounded-card border border-border bg-background-card p-4 transition-[border-color,box-shadow] duration-200 hover:border-border-hover hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {rev.auteur.avatarUrl ? (
                        <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-pill border border-border">
                          <Image src={rev.auteur.avatarUrl} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-forest-100 text-xs font-semibold text-forest-800">
                          {initials}
                        </span>
                      )}
                      <div className="min-w-0">
                        {/* `<h3>` créait un niveau de titre par avis, donc une
                           dizaine de titres dans le plan du document pour du
                           contenu qui n'en est pas. */}
                        <p className="truncate text-sm font-semibold leading-tight text-foreground">
                          {authorName}
                        </p>
                        {dateStr && (
                          <p className="mt-0.5 text-xs text-foreground-muted">
                            <time dateTime={rev.creeLe.slice(0, 10)}>{dateStr}</time>
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className="flex shrink-0 items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2 py-1 text-gold-700"
                      aria-label={`Note : ${rev.note} sur 5`}
                    >
                      <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
                      <span className="text-xs font-semibold tabular-nums">{rev.note}</span>
                    </span>
                  </div>

                  {rev.commentaire ? (
                    /* L'italique sur un paragraphe entier fatigue à la lecture,
                       et les guillemets doubles anglais sont incorrects en
                       français. Un <blockquote> avec un liseré dit la même
                       chose visuellement, en restant lisible. */
                    <blockquote className="border-l-2 border-border pl-3 text-sm leading-relaxed text-foreground">
                      {rev.commentaire}
                    </blockquote>
                  ) : (
                    <p className="text-xs text-foreground-muted">
                      Note attribuée sans commentaire.
                    </p>
                  )}
                </div>

                <p className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-foreground-muted">
                  <ShieldCheck className="h-3 w-3 shrink-0 text-forest-600" aria-hidden="true" />
                  Séjour vérifié par Klef
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-background-alt p-8 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-pill border border-border bg-background-card text-foreground-muted">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="font-display text-base font-semibold text-foreground">
            Aucun avis pour le moment
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-foreground-muted">
            Ce logement n’a pas encore reçu d’avis. Les commentaires apparaissent ici après le
            séjour des voyageurs.
          </p>
        </div>
      )}
    </section>
  );
}