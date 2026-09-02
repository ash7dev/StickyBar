'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DayPicker, type DateRange } from 'react-day-picker';
import { fr } from 'react-day-picker/locale';
import { AlertCircle, Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Lock, X } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import 'react-day-picker/style.css';

interface Props {
  logements: Array<{ id: string; titre: string; ville?: string }>;
  isOpen: boolean;
  onClose: () => void;
}

function fmtShort(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function GestionnaireBlockDatesModal({ logements, isOpen, onClose }: Props) {
  const [logementId, setLogementId] = useState(logements[0]?.id || '');
  const [range, setRange] = useState<DateRange | undefined>();
  const [motif, setMotif] = useState('MAINTENANCE');
  const [showCalendar, setShowCalendar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const blockMutation = useMutation({
    mutationFn: (data: { logementId: string; dateDebut: string; dateFin: string; motif: string }) =>
      nestFetch(NEST_API.CALENDRIER.CREATE(data.logementId), {
        method: 'POST',
        body: JSON.stringify({
          dateDebut: data.dateDebut,
          dateFin: data.dateFin,
          motif: data.motif,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestionnaire', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'gestionnaire'] });
      onClose();
    },
    onError: (e) => {
      setErrorMsg(e instanceof Error ? e.message : 'Impossible de bloquer ces dates.');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logementId || !range?.from || !range?.to) {
      setErrorMsg('Veuillez sélectionner le logement ainsi que la plage de dates sur le calendrier.');
      return;
    }
    setErrorMsg(null);
    const dateDebut = range.from.toISOString().split('T')[0];
    const dateFin = range.to.toISOString().split('T')[0];
    blockMutation.mutate({ logementId, dateDebut, dateFin, motif });
  };

  const nights =
    range?.from && range?.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-card border border-border bg-white p-6 sm:p-7 shadow-2xl shadow-forest-950/15 space-y-5 animate-in zoom-in-95 duration-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── En-tête de la Modale ──────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-pill bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-forest-900 tracking-tight">
                Bloquer des dates (Indisponibilité)
              </h3>
              <p className="text-xs text-foreground-muted font-medium mt-0.5">
                Rendre un logement conciergerie temporairement indisponible.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-pill hover:bg-neutral-100 text-foreground-muted transition-colors cursor-pointer"
            aria-label="Fermer la fenêtre"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Message d'erreur */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-card border border-error-500/20 bg-error-50 p-3.5 text-xs text-error-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-error-600" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* 1. Sélection Logement avec Fond Blanc Pure */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Logement sous conciergerie *</label>
            <select
              value={logementId}
              onChange={(e) => setLogementId(e.target.value)}
              className="w-full rounded-pill border border-border bg-white text-neutral-900 px-4 py-3 font-semibold focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/10 cursor-pointer shadow-2xs [color-scheme:light]"
            >
              {logements.map((l) => (
                <option key={l.id} value={l.id} className="bg-white text-neutral-900 py-1">
                  {l.titre} {l.ville ? `(${l.ville})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Plage de Dates avec Calendrier Personnalisé DayPicker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground">Plage de dates à bloquer *</label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-xs font-bold text-forest-600 hover:text-forest-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{showCalendar ? 'Masquer le calendrier' : 'Ouvrir le calendrier'}</span>
              </button>
            </div>

            {/* Aperçu rapide des dates sélectionnées */}
            <div
              onClick={() => setShowCalendar(true)}
              className="flex items-center justify-between p-3.5 rounded-inner border border-border bg-white hover:border-forest-600/40 cursor-pointer transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-forest-600 shrink-0" />
                <div>
                  <p className="font-bold text-forest-900">
                    {range?.from && range?.to
                      ? `${fmtShort(range.from)} → ${fmtShort(range.to)}`
                      : range?.from
                      ? `Du ${fmtShort(range.from)} (Sélectionner date de fin)`
                      : 'Cliquez pour sélectionner la période sur le calendrier'}
                  </p>
                  {nights > 0 && (
                    <p className="text-[0.65rem] font-semibold text-forest-700">
                      {nights} jour{nights > 1 ? 's' : ''} bloqué{nights > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-xs font-bold text-forest-700 bg-forest-50 px-2.5 py-1 rounded-pill border border-forest-200/80">
                {showCalendar ? 'Ouvert' : 'Sélectionner'}
              </span>
            </div>

            {/* Calendrier interactif DayPicker incorporé */}
            {showCalendar && (
              <div className="p-4 rounded-card border border-border bg-white shadow-inner rdp-modal-picker animate-in fade-in duration-200">
                <DayPicker
                  mode="range"
                  locale={fr}
                  selected={range}
                  onSelect={(r) => {
                    setRange(r);
                    if (r?.from && r?.to) {
                      setShowCalendar(false);
                    }
                  }}
                  numberOfMonths={1}
                  startMonth={today}
                  disabled={{ before: today }}
                  showOutsideDays={false}
                />
              </div>
            )}
          </div>

          {/* 3. Motif du blocage avec Fond Blanc Pure */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Motif du blocage</label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full rounded-pill border border-border bg-white text-neutral-900 px-4 py-3 font-semibold focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/10 cursor-pointer shadow-2xs [color-scheme:light]"
            >
              <option value="MAINTENANCE" className="bg-white text-neutral-900 py-1">🛠️ Maintenance & Réparations (Clim, Plomberie...)</option>
              <option value="MENAGE_GRAND" className="bg-white text-neutral-900 py-1">🧹 Ménage approfondi / Désinfection</option>
              <option value="USAGE_PROPRIETAIRE" className="bg-white text-neutral-900 py-1">🏡 Usage du Propriétaire / Bailleur Partner</option>
              <option value="AUTRE" className="bg-white text-neutral-900 py-1">⛔ Autre motif d'indisponibilité</option>
            </select>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-pill border border-border bg-white hover:bg-neutral-100 text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={blockMutation.isPending}
              className="btn-action inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-forest-950 disabled:opacity-50 border-none cursor-pointer"
            >
              <Lock className="w-4 h-4 text-forest-950" aria-hidden="true" />
              <span>{blockMutation.isPending ? 'Enregistrement...' : 'Confirmer le blocage'}</span>
            </button>
          </div>
        </form>

        <style>{`
          .rdp-modal-picker .rdp-root {
            --rdp-accent-color: var(--forest-600);
            --rdp-accent-background-color: var(--forest-50);
            font-family: var(--font-sans);
            width: 100%;
          }
          .rdp-modal-picker .rdp-months { width: 100%; }
          .rdp-modal-picker .rdp-month { width: 100%; }
          .rdp-modal-picker table { width: 100%; border-collapse: collapse; }
          .rdp-modal-picker .rdp-day {
            border-radius: 0.5rem;
            font-size: 0.8125rem;
            font-weight: 500;
          }
          .rdp-modal-picker .rdp-selected:not(.rdp-range_middle) {
            background: var(--forest-600) !important;
            color: #ffffff !important;
            font-weight: 800;
          }
          .rdp-modal-picker .rdp-range_middle {
            background: var(--forest-50) !important;
            color: var(--forest-800) !important;
          }
        `}</style>
      </div>
    </div>
  );
}
