'use client';

import Link from 'next/link';
import { Sparkles, Coins, Trophy, ChevronRight, X, ShieldCheck } from 'lucide-react';
import { useTerangaClub } from '../hooks/use-teranga-club';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  earnedCoins?: number;
}

const TIER_GOALS: Record<string, { nextTier: string; icon: string; goalText: string; perkText: string }> = {
  BRONZE: {
    nextTier: "Clé d'Argent 🔑",
    icon: '🔑',
    goalText: 'Atteignez 3 séjours ou 300 000 FCFA dépensés',
    perkText: 'Débloquez 2.0% de cashback (+33% de bonus) + Traitement prioritaire',
  },
  SILVER: {
    nextTier: "Clé d'Or Teranga 👑",
    icon: '👑',
    goalText: 'Atteignez 8 séjours ou 1 000 000 FCFA dépensés',
    perkText: 'Débloquez 3.0% de cashback maximal + Priorité absolue auprès des hôtes',
  },
  GOLD: {
    nextTier: 'Membre d’Élite Gold 👑',
    icon: '👑',
    goalText: 'Statut maximal Clé d’Or atteint',
    perkText: 'Vous profitez du cashback maximal de 3.0% et du statut Certifié Gold !',
  },
};

export function TerangaRewardModal({ isOpen, onClose, earnedCoins = 1500 }: Props) {
  const { data: teranga } = useTerangaClub();

  if (!isOpen) return null;

  const currentTier = teranga?.tier ?? 'BRONZE';
  const tierInfo = TIER_GOALS[currentTier] ?? TIER_GOALS.BRONZE;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-background-card w-full max-w-md rounded-2xl border border-forest-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        {/* Bouton fermeture */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-forest-900/80 border border-forest-100 flex items-center justify-center text-forest-800 hover:bg-white transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* En-tête festif avec dégradé vert & or */}
        <div className="bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800 text-white p-6 pt-8 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-lime-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gold-400/20 blur-2xl" />

          {/* Badge animation */}
          <div className="relative mx-auto mb-3 w-16 h-16 rounded-2xl bg-gradient-to-tr from-lime-400 to-gold-300 p-0.5 shadow-lg animate-bounce">
            <div className="w-full h-full rounded-[14px] bg-forest-950 flex items-center justify-center text-lime-300">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>

          <h3 className="font-display text-xl font-extrabold text-white">
            🎉 Check-in Validé !
          </h3>
          <p className="text-xs text-forest-200 mt-1 font-medium">
            Votre installation est confirmée. Bon séjour dans votre logement !
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Recompense Coins */}
          <div className="p-4 rounded-xl border border-lime-500/30 bg-gradient-to-br from-lime-500/10 via-forest-50/40 to-background-card space-y-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-lime-400/20 border border-lime-400/30 text-forest-800 text-xs font-bold">
              <Coins className="w-4 h-4 text-forest-800" />
              <span>CASHBACK ACCUMULÉ</span>
            </div>
            
            <div className="font-display text-3xl font-black text-forest-900 tracking-tight">
              +{earnedCoins.toLocaleString('fr-FR')} Coins
            </div>
            
            <p className="text-xs text-foreground-muted leading-relaxed">
              Vos Klef Coins seront débloqués sur votre compte dès la fin de ce séjour pour réduire la facture de vos <strong className="text-forest-900 font-bold">prochaines vacances</strong> !
            </p>
          </div>

          {/* Gamification : Progression vers le statut supérieur */}
          <div className="p-4 rounded-xl border border-border bg-background-alt space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-faint">
                Objectif Privilège
              </span>
              <span className="text-xs font-bold text-forest-800 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-gold-500" />
                {tierInfo.nextTier}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">{tierInfo.goalText}</span>
                <span className="text-forest-700 font-bold">En cours</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-forest-600 to-lime-500 w-3/5" />
              </div>
            </div>

            <p className="text-[11px] text-foreground-muted flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-600 shrink-0" />
              <span>{tierInfo.perkText}</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <Link
              href="/teranga-club"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-pill bg-forest-900 hover:bg-forest-950 text-white font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <span>Découvrir le Klef Teranga Club</span>
              <ChevronRight className="w-4 h-4 text-lime-300" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors text-center"
            >
              Fermer et profiter de mon séjour
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
