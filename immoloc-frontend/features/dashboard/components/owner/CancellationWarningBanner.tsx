'use client';

import { AlertTriangle, LifeBuoy } from 'lucide-react';
import { useAssistantStore } from '@/stores/assistant.store';
import { useCurrentUser } from '@/hooks/use-current-user';

interface Props {
  nbAnnulations?: number;
  nbAbsencesJourJ?: number;
  threshold?: number;
  warningStart?: number;
}

export function CancellationWarningBanner({
  nbAnnulations: propAnnulations,
  nbAbsencesJourJ: propAbsences,
  threshold = 7,
  warningStart = 4,
}: Props = {}) {
  const { data: user } = useCurrentUser();
  const openAssistant = useAssistantStore((s) => s.openAssistant);

  const nbAnnulations = propAnnulations ?? user?.nbAnnulations ?? 0;
  const nbAbsencesJourJ = propAbsences ?? user?.nbAbsencesJourJ ?? 0;

  const maxFautes = Math.max(nbAnnulations, nbAbsencesJourJ);
  const remainingBeforeSuspension = threshold - maxFautes;

  // S'affiche si l'hôte est à 3 fautes ou moins du seuil de suspension (ex: 4, 5 ou 6 fautes sur 7)
  if (maxFautes < warningStart) {
    return null;
  }

  const handleOpenTicket = () => {
    openAssistant({
      tab: 'tickets',
      category: 'RESERVATION',
      subject: "Demande de réinitialisation du compteur d'annulations",
      message: `Bonjour l'équipe Support Klef,\n\nJe sollicite une réinitialisation de mon compteur d'annulations/absences (${maxFautes}/${threshold} fautes enregistrées).\n\nVoici les motifs et justificatifs de mes annulations précédentes :\n- Raison : `,
    });
  };

  return (
    <aside className="klef-rise relative overflow-hidden rounded-card border border-amber-500/40 bg-gradient-to-r from-amber-950/95 via-amber-900/80 to-forest-950 p-5 text-neutral-50 shadow-xl transition-all">
      {/* Glow décoratif */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-5 w-5 animate-pulse text-amber-400" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-amber-200">
                Seuil de suspension proche : {maxFautes}/{threshold} fautes
              </h3>
              <span className="rounded-pill bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                Plus que {remainingBeforeSuspension} chance{remainingBeforeSuspension > 1 ? 's' : ''}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-amber-100/90 max-w-3xl">
              Vous avez accumulé <strong className="text-white">{maxFautes} annulation(s) / absence(s)</strong> sur un maximum de {threshold} autorisées. À {threshold} fautes, vos annonces seront <span className="underline decoration-amber-400 decoration-2">automatiquement suspendues</span>.
            </p>
            <p className="text-[11px] text-amber-200/70">
              Si vous avez des motifs légitimes ou des cas de force majeure, transmettez vos explications pour demander une réinitialisation du compteur.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenTicket}
          className="inline-flex shrink-0 items-center gap-2 rounded-pill bg-action px-4 py-2.5 text-xs font-extrabold text-forest-950 shadow-md transition-all hover:bg-action-hover active:scale-95"
        >
          <LifeBuoy className="h-4 w-4 shrink-0 text-forest-950" />
          <span>Demander une réinitialisation</span>
        </button>
      </div>
    </aside>
  );
}
