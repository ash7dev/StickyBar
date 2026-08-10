'use client';

import { Sparkles, CheckCircle2, Lock, Coins } from 'lucide-react';
import type { TerangaQuest } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface Props {
  quests: TerangaQuest[];
  isAuthenticated: boolean;
}

export function TerangaQuestsCard({ quests, isAuthenticated }: Props) {
  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="marker-box border border-forest-100 bg-forest-50 text-forest-700">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Quêtes & Badges Teranga
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Accomplissez des défis pour débloquer des bonus instantanés en Klef Coins.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quests.map((quest) => (
          <div
            key={quest.code}
            className={cn(
              'rounded-card border p-4.5 transition-all flex items-start justify-between gap-4',
              quest.unlocked
                ? 'bg-forest-50/60 border-forest-200'
                : 'bg-background-alt/60 border-border hover:border-border-hover'
            )}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <span className="w-10 h-10 rounded-inner bg-forest-50 border border-forest-100 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                {quest.icone}
              </span>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{quest.libelle}</span>
                  {quest.unlocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-700 bg-success-50 border border-success-500/25 px-2 py-0.5 rounded-pill">
                      <CheckCircle2 className="w-3 h-3" />
                      Complété
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground-muted bg-background-card border border-border px-2 py-0.5 rounded-pill">
                      <Lock className="w-2.5 h-2.5" />
                      À débloquer
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  {quest.description}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 bg-forest-50 border border-forest-200 px-3 py-1 rounded-pill">
                +{quest.bonusCoins} <Coins className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
