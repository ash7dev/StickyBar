'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, CheckCircle2, CreditCard, Eye, ImageOff, Phone, ShieldCheck, User, Wallet, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Proprietaire {
  id: string;
  prenom: string;
  nom: string;
  telephone?: string;
}

interface LogementItem {
  id: string;
  titre: string;
  ville?: string;
  commune?: string;
  photos?: Array<{ url: string } | string>;
  proprietaire?: Proprietaire;
}

interface ReservationItem {
  id: string;
  code?: string;
  logementId: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  prixTotal?: number;
  totalLocataire?: number;
  netProprietaire?: number;
  travelerName?: string;
  travelerPhone?: string;
  logementTitle?: string;
  ownerName?: string;
  fournisseurPaiement?: string;
  statutPaiement?: string;
  estAcompte?: boolean;
}

interface Props {
  logements: LogementItem[];
  reservations: ReservationItem[];
  currentDate: Date;
}

export function GestionnaireGanttView({ logements, reservations, currentDate }: Props) {
  const [selectedResa, setSelectedResa] = useState<ReservationItem | null>(null);

  // Générer les jours du mois sélectionné
  const { daysInMonth, daysList } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const list = Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(year, month, i + 1);
      const isToday =
        d.getDate() === new Date().getDate() &&
        d.getMonth() === new Date().getMonth() &&
        d.getFullYear() === new Date().getFullYear();
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      return {
        dayNum: i + 1,
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('fr-FR', { weekday: 'narrow' }),
        isToday,
        isWeekend,
      };
    });

    return { daysInMonth: totalDays, daysList: list };
  }, [currentDate]);

  const fcfa = (n?: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

  return (
    <div className="rounded-card border border-border bg-background-card p-5 sm:p-7 shadow-2xs space-y-6 min-h-[520px] sm:min-h-[640px] flex flex-col justify-between">
      {/* ── Légende ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5 text-xs font-bold text-foreground-muted">
        <div className="flex flex-wrap items-center gap-5 sm:gap-6">
          <span className="flex items-center gap-2 bg-success-50 border border-success-500/20 px-3 py-1.5 rounded-pill text-success-800">
            <span className="w-2.5 h-2.5 rounded-pill bg-success-500 shadow-2xs" />
            <span>Séjour Confirmé / En cours</span>
          </span>

          <span className="flex items-center gap-2 bg-warning-50 border border-warning-500/20 px-3 py-1.5 rounded-pill text-warning-800">
            <span className="w-2.5 h-2.5 rounded-pill bg-warning-500 shadow-2xs" />
            <span>En attente de paiement</span>
          </span>

          <span className="flex items-center gap-2 bg-forest-950 border border-white/20 text-neutral-0 px-3 py-1.5 rounded-pill">
            <span className="w-2.5 h-2.5 rounded-pill bg-gold-400 shadow-2xs" />
            <span>Indisponible / Travaux</span>
          </span>
        </div>

        <span className="bg-forest-50 border border-forest-200/80 px-3.5 py-1.5 rounded-pill text-forest-800 font-extrabold text-xs">
          {logements.length} logement{logements.length > 1 ? 's' : ''} sous conciergerie
        </span>
      </div>

      {/* ── Grille Gantt ──────────────────────────────────────────────── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse text-left min-w-[850px]">
          <thead>
            <tr className="border-b border-border text-[0.7rem] font-bold uppercase tracking-wider text-foreground-muted">
              <th className="p-3.5 w-72 min-w-[260px] sticky left-0 bg-background-card z-20 shadow-xs">
                Logement & Bailleur
              </th>
              {daysList.map((d) => (
                <th
                  key={d.dayNum}
                  className={cn(
                    'p-1.5 text-center min-w-[36px] font-bold border-l border-border/40',
                    d.isToday ? 'bg-forest-50 text-forest-800' : '',
                    d.isWeekend ? 'bg-background-alt/50' : '',
                  )}
                >
                  <span className="block text-[0.65rem] text-foreground-faint">{d.dayName}</span>
                  <span className="text-xs font-extrabold">{d.dayNum}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {logements.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 1} className="py-20 text-center text-foreground-muted font-medium">
                  Aucun logement ne correspond aux critères de recherche.
                </td>
              </tr>
            ) : (
              logements.map((logement) => {
                const first = logement.photos?.[0];
                const photo = typeof first === 'string' ? first : first?.url;
                const prop = logement.proprietaire;

                // Réservations de ce logement
                const logementResas = reservations.filter((r) => r.logementId === logement.id);

                return (
                  <tr key={logement.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Colonne Logement sticky */}
                    <td className="p-3.5 sticky left-0 bg-background-card z-10 shadow-xs border-r border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-inner bg-neutral-100 shadow-inner">
                          {photo ? (
                            <Image src={photo} alt="" fill sizes="56px" className="object-cover" />
                          ) : (
                            <span className="grid h-full place-items-center text-neutral-300">
                              <ImageOff className="h-5 w-5" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <Link
                            href={`/gestionnaire/annonces/${logement.id}`}
                            className="font-bold text-sm text-forest-950 hover:text-forest-600 truncate block line-clamp-1"
                          >
                            {logement.titre}
                          </Link>
                          {prop && (
                            <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-pill border border-forest-200/80 truncate">
                              <User className="h-3 w-3 text-forest-600" /> Bailleur : {prop.prenom} {prop.nom}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cellules des jours */}
                    {daysList.map((d) => {
                      // Trouver si une réservation commence ou passe ce jour-ci
                      const matchingResa = logementResas.find((r) => {
                        const start = new Date(r.dateDebut).toISOString().split('T')[0];
                        const end = new Date(r.dateFin).toISOString().split('T')[0];
                        return d.dateStr >= start && d.dateStr <= end;
                      });

                      let shouldRenderBar = false;
                      let barDays = 1;

                      if (matchingResa) {
                        const startStr = new Date(matchingResa.dateDebut).toISOString().split('T')[0];
                        const endStr = new Date(matchingResa.dateFin).toISOString().split('T')[0];

                        const isStart = startStr === d.dateStr;
                        const isOverflowStart = d.dayNum === 1 && startStr < daysList[0].dateStr && endStr >= d.dateStr;

                        if (isStart || isOverflowStart) {
                          shouldRenderBar = true;

                          const startDayNum = isOverflowStart ? 1 : new Date(matchingResa.dateDebut).getDate();
                          const endDateObj = new Date(matchingResa.dateFin);

                          const currentMonth = currentDate.getMonth();
                          const currentYear = currentDate.getFullYear();

                          let endDayNum = endDateObj.getDate();
                          if (
                            endDateObj.getFullYear() > currentYear ||
                            (endDateObj.getFullYear() === currentYear && endDateObj.getMonth() > currentMonth)
                          ) {
                            endDayNum = daysInMonth;
                          }

                          barDays = Math.max(1, endDayNum - startDayNum + 1);
                        }
                      }

                      return (
                        <td
                          key={d.dayNum}
                          className={cn(
                            'p-0.5 border-l border-border/40 relative h-16 sm:h-20 text-center align-middle',
                            d.isToday ? 'bg-forest-50/40' : '',
                            d.isWeekend ? 'bg-background-alt/40' : '',
                          )}
                        >
                          {matchingResa && shouldRenderBar && (
                            <div
                              className="group absolute top-2 bottom-2 left-0.5 z-10"
                              style={{
                                width: `calc(${barDays * 36}px - 4px)`,
                              }}
                            >
                              {/* ── Popover Tooltip au survol ───────────────────────── */}
                              <div className="pointer-events-none absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 z-50 w-72 p-3.5 rounded-2xl border border-white/15 bg-forest-950 text-neutral-50 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-left space-y-2.5">
                                {/* Flèche décorative pointant vers la barre */}
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-forest-950 border-r border-b border-white/15" />

                                {/* Entête Tooltip : Code + Badge Statut */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                  <span className="font-mono text-[0.65rem] font-extrabold text-lime-400">
                                    #{matchingResa.code || matchingResa.id.substring(0, 8).toUpperCase()}
                                  </span>
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider',
                                      matchingResa.statut === 'CONFIRMED' ||
                                        matchingResa.statut === 'PAID' ||
                                        matchingResa.statut === 'CHECKED_IN' ||
                                        matchingResa.statut === 'COMPLETED'
                                        ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                                        : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                    )}
                                  >
                                    {matchingResa.statut === 'CONFIRMED'
                                      ? 'Confirmé'
                                      : matchingResa.statut === 'CHECKED_IN'
                                      ? 'Check-in fait'
                                      : matchingResa.statut === 'PAID'
                                      ? 'Payé'
                                      : 'En attente'}
                                  </span>
                                </div>

                                {/* Info Locataire */}
                                <div className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-forest-300 shrink-0" />
                                  <span className="text-xs font-bold text-neutral-50 truncate">
                                    {matchingResa.travelerName || 'Voyageur'}
                                  </span>
                                  {matchingResa.travelerPhone && (
                                    <span className="text-[0.65rem] text-forest-300 ml-auto font-mono">
                                      {matchingResa.travelerPhone}
                                    </span>
                                  )}
                                </div>

                                {/* Dates & Nombre de nuits */}
                                <div className="flex items-center gap-2 text-[0.7rem] text-forest-200">
                                  <Calendar className="h-3.5 w-3.5 text-forest-300 shrink-0" />
                                  <span>
                                    {new Date(matchingResa.dateDebut).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                    {' → '}
                                    {new Date(matchingResa.dateFin).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </span>
                                  <span className="ml-auto font-bold text-lime-300 bg-white/10 px-1.5 py-0.5 rounded-md">
                                    {Math.max(
                                      1,
                                      Math.ceil(
                                        (new Date(matchingResa.dateFin).getTime() -
                                          new Date(matchingResa.dateDebut).getTime()) /
                                          86400000
                                      )
                                    )}{' '}
                                    nuits
                                  </span>
                                </div>

                                {/* Détails Financiers & Mode de paiement */}
                                <div className="border-t border-white/10 pt-2 space-y-1 text-[0.7rem]">
                                  <div className="flex items-center justify-between">
                                    <span className="text-forest-300 flex items-center gap-1">
                                      <Wallet className="h-3 w-3 text-lime-400 shrink-0" />
                                      Paiement ({matchingResa.fournisseurPaiement || 'Wave / OM'}) :
                                    </span>
                                    <span className="font-bold text-neutral-50 tabular-nums">
                                      {fcfa(matchingResa.prixTotal || matchingResa.totalLocataire)} FCFA
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[0.65rem]">
                                    <span className="text-forest-300">Règlement :</span>
                                    <span className="font-semibold text-lime-300">
                                      {matchingResa.estAcompte ? 'Acompte (Reste au check-in)' : 'Totalité 100% payée'}
                                    </span>
                                  </div>

                                  {matchingResa.netProprietaire ? (
                                    <div className="flex items-center justify-between text-[0.65rem]">
                                      <span className="text-forest-300">Net Bailleur :</span>
                                      <span className="font-bold text-lime-300 tabular-nums">
                                        {fcfa(matchingResa.netProprietaire)} FCFA
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              {/* Bouton de la barre Gantt */}
                              <button
                                type="button"
                                onClick={() => setSelectedResa(matchingResa)}
                                className={cn(
                                  'w-full h-full rounded-pill px-3 text-[0.6875rem] font-extrabold shadow-sm truncate flex items-center justify-between gap-1.5 transition-all hover:scale-[1.02] cursor-pointer',
                                  matchingResa.statut === 'CONFIRMED' ||
                                    matchingResa.statut === 'PAID' ||
                                    matchingResa.statut === 'CHECKED_IN' ||
                                    matchingResa.statut === 'COMPLETED'
                                    ? 'bg-success-50 text-success-700 border border-success-500/40'
                                    : matchingResa.statut === 'PENDING'
                                    ? 'bg-warning-50 text-warning-700 border border-warning-500/40'
                                    : 'bg-forest-950 text-neutral-0 border border-white/20'
                                )}
                              >
                                <span className="truncate">{matchingResa.travelerName || 'Locataire'}</span>
                                <span className="opacity-90 shrink-0 font-bold">
                                  ({fcfa(matchingResa.prixTotal || matchingResa.totalLocataire)} FCFA)
                                </span>
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Détail Séjour Conciergerie ─────────────────────────────── */}
      {selectedResa && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedResa(null)}
        >
          <div
            className="w-full max-w-md rounded-card border border-border bg-background-card p-6 sm:p-7 shadow-2xl shadow-forest-950/10 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-pill bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-forest-900 tracking-tight">
                    Détail du Séjour Conciergerie
                  </h3>
                  <p className="text-xs text-foreground-muted font-medium mt-0.5">
                    Informations du locataire et dates réservées.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResa(null)}
                className="p-1.5 rounded-pill hover:bg-neutral-100 text-foreground-muted transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-foreground">
              <div className="p-3.5 rounded-inner bg-background-alt border border-border space-y-1.5">
                <p className="font-bold text-sm text-forest-900">{selectedResa.travelerName || 'Locataire'}</p>
                <p className="text-foreground-muted">Logement : <span className="font-semibold text-foreground">{selectedResa.logementTitle}</span></p>
                {selectedResa.ownerName && (
                  <p className="text-foreground-muted">Bailleur partenaire : <span className="font-semibold text-forest-700">{selectedResa.ownerName}</span></p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-inner border border-border bg-neutral-50 space-y-0.5">
                  <span className="text-[0.65rem] font-bold text-foreground-muted uppercase tracking-wider">Arrivée (Check-in)</span>
                  <p className="font-bold text-forest-900">
                    {new Date(selectedResa.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-3 rounded-inner border border-border bg-neutral-50 space-y-0.5">
                  <span className="text-[0.65rem] font-bold text-foreground-muted uppercase tracking-wider">Départ (Check-out)</span>
                  <p className="font-bold text-forest-900">
                    {new Date(selectedResa.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3.5 text-xs font-semibold">
                <span className="text-foreground-muted">Total Réservation Locataire :</span>
                <span className="text-base font-extrabold tabular-nums text-forest-900">{fcfa(selectedResa.prixTotal || selectedResa.totalLocataire)} FCFA</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              {selectedResa.travelerPhone && (
                <a
                  href={`tel:${selectedResa.travelerPhone}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-pill border border-border bg-background-card hover:bg-neutral-100 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-forest-600" aria-hidden="true" />
                  <span>Contacter</span>
                </a>
              )}

              <Link
                href={`/gestionnaire/annonces/${selectedResa.logementId}`}
                className="btn-action inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-forest-950 border-none cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Voir le bien</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
