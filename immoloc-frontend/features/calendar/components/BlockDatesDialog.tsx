'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import type { OwnerCalendarLogement } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
import { useCreateCalendarBlocks } from '../hooks/use-owner-calendar';
import { addDays, diffDays, todayDay, type Day } from '../lib/days';

const MOTIFS = ['Usage personnel', 'Travaux / entretien', 'Réservé sur une autre plateforme', 'Autre'] as const;

export interface BlockDraft {
  logementIds: string[];
  /** Premier jour bloqué */
  start: Day;
  /** Jour de fin exclu */
  end: Day;
}

interface BlockDatesDialogProps {
  onClose: () => void;
  logements: OwnerCalendarLogement[];
  draft: BlockDraft | null;
}

export function BlockDatesDialog({ onClose, logements, draft }: BlockDatesDialogProps) {
  const today = todayDay();
  const createBlocks = useCreateCalendarBlocks();

  // État initialisé au montage : le parent monte la fenêtre à chaque ouverture (prop `key`).
  const [logementIds, setLogementIds] = useState<string[]>(
    () => draft?.logementIds ?? (logements.length === 1 ? [logements[0].id] : []),
  );
  const [firstDay, setFirstDay] = useState<Day>(() => draft?.start ?? today);
  // Le formulaire affiche le DERNIER jour bloqué (inclus), plus naturel qu'une date de fin exclue.
  const [lastDay, setLastDay] = useState<Day>(() => (draft ? addDays(draft.end, -1) : today));
  const [motif, setMotif] = useState<(typeof MOTIFS)[number]>(MOTIFS[0]);
  const [customMotif, setCustomMotif] = useState('');

  const nights = lastDay >= firstDay ? diffDays(firstDay, lastDay) + 1 : 0;
  const finalMotif = motif === 'Autre' ? customMotif.trim() : motif;
  const canSubmit = logementIds.length > 0 && nights > 0 && !createBlocks.isPending;

  function toggleLogement(id: string) {
    setLogementIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    createBlocks.mutate(
      {
        logementIds,
        dateDebut: firstDay,
        dateFin: addDays(lastDay, 1),
        ...(finalMotif ? { motif: finalMotif } : {}),
      },
      { onSuccess: onClose },
    );
  }

  const allSelected = logementIds.length === logements.length;

  return (
    <Modal
      open
      onClose={onClose}
      title="Bloquer des dates"
      description="Les voyageurs ne pourront pas réserver ces nuits."
      icon={<Lock className="h-5 w-5" aria-hidden="true" />}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost px-5 py-2.5 text-sm">
            Annuler
          </button>
          <button
            type="submit"
            form="block-dates-form"
            disabled={!canSubmit}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            {createBlocks.isPending
              ? 'Blocage…'
              : `Bloquer ${nights} nuit${nights > 1 ? 's' : ''}`}
          </button>
        </>
      }
    >
      <form id="block-dates-form" onSubmit={handleSubmit} className="space-y-5 text-sm">
        {createBlocks.error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3 text-xs font-medium text-error-700"
          >
            <AlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{createBlocks.error.message}</span>
          </div>
        )}

        <fieldset className="space-y-2">
          <div className="flex items-center justify-between">
            <legend className="font-semibold text-foreground">Logements</legend>
            {logements.length > 1 && (
              <button
                type="button"
                onClick={() => setLogementIds(allSelected ? [] : logements.map((l) => l.id))}
                className="text-xs font-semibold text-link hover:text-link-hover"
              >
                {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            )}
          </div>
          <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {logements.map((logement) => {
              const checked = logementIds.includes(logement.id);
              return (
                <label
                  key={logement.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-inner border px-3 py-2.5 transition-colors',
                    checked ? 'border-forest-500 bg-forest-50' : 'border-border hover:border-border-hover',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLogement(logement.id)}
                    className="h-4 w-4 accent-forest-600"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">{logement.titre}</span>
                  <span className="shrink-0 text-xs text-foreground-muted">{logement.ville}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="block font-semibold text-foreground">Premier jour</span>
            <input
              type="date"
              required
              min={today}
              value={firstDay}
              onChange={(e) => {
                const value = e.target.value;
                setFirstDay(value);
                if (value > lastDay) setLastDay(value);
              }}
              className="w-full rounded-field border border-border bg-background-card px-3 py-2.5 text-foreground focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </label>
          <label className="space-y-1.5">
            <span className="block font-semibold text-foreground">Dernier jour</span>
            <input
              type="date"
              required
              min={firstDay}
              value={lastDay}
              onChange={(e) => setLastDay(e.target.value)}
              className="w-full rounded-field border border-border bg-background-card px-3 py-2.5 text-foreground focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="font-semibold text-foreground">Motif</legend>
          <div className="flex flex-wrap gap-2">
            {MOTIFS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={motif === m}
                onClick={() => setMotif(m)}
                className={cn(
                  'rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors',
                  motif === m
                    ? 'border-forest-600 bg-forest-600 text-white'
                    : 'border-border text-foreground hover:border-border-hover',
                )}
              >
                {m}
              </button>
            ))}
          </div>
          {motif === 'Autre' && (
            <input
              type="text"
              maxLength={200}
              value={customMotif}
              onChange={(e) => setCustomMotif(e.target.value)}
              placeholder="Précisez (facultatif)"
              aria-label="Motif personnalisé"
              className="w-full rounded-field border border-border bg-background-card px-3 py-2.5 text-foreground focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          )}
        </fieldset>

        <p className="text-xs text-foreground-muted">
          Si ces dates touchent un blocage existant, les deux sont fusionnés automatiquement.
        </p>
      </form>
    </Modal>
  );
}
