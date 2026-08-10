'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, CheckCircle2, Coins, Loader2, ArrowUpRight, Trophy, Target,
  UserCheck, Share2, Star, CalendarCheck, Home, MessageSquare, Wallet,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TerangaQuest } from '@/lib/nestjs';
import { terangaClubApi } from '@/lib/nestjs';
import { TerangaQuestClaimModal, type QuestClaimResult } from './TerangaQuestClaimModal';

/* ─── Icônes ───────────────────────────────────────────────────────────────
   `quest.icone` contenait un emoji rendu tel quel. Trois problèmes : le rendu
   change sur chaque plateforme, la taille ne suit pas la typographie, et les
   lecteurs d'écran les annoncent littéralement (« visage souriant »).
   Les icônes sont désormais choisies par code de quête.

   ⚠️ Adapte les clés à tes codes réels — le repli reste `Target`. */
const QUEST_ICONS: Record<string, typeof Target> = {
  PROFIL_COMPLET: UserCheck,
  KYC_VERIFIE: ShieldCheck,
  PREMIERE_RESERVATION: CalendarCheck,
  PREMIER_LOGEMENT: Home,
  PREMIER_AVIS: Star,
  PARRAINAGE: Share2,
  WALLET_ALIMENTE: Wallet,
  MESSAGE_ENVOYE: MessageSquare,
};

const iconFor = (code: string) => QUEST_ICONS[code] ?? Target;

interface Props {
  quests: TerangaQuest[];
  isAuthenticated: boolean;
  onClaimSuccess?: () => void;
  userId?: string;
}

export function TerangaQuestsCard({ quests, isAuthenticated, onClaimSuccess, userId }: Props) {
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [modalResult, setModalResult] = useState<QuestClaimResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  /* Aucune vue d'ensemble : l'utilisateur ne savait ni combien de quêtes il
     avait accomplies, ni combien de coins restaient à gagner. */
  const { debloquees, total, coinsGagnes, coinsRestants } = useMemo(() => {
    const done = quests.filter((q) => q.unlocked);
    return {
      debloquees: done.length,
      total: quests.length,
      coinsGagnes: done.reduce((s, q) => s + (Number(q.bonusCoins) || 0), 0),
      coinsRestants: quests
        .filter((q) => !q.unlocked)
        .reduce((s, q) => s + (Number(q.bonusCoins) || 0), 0),
    };
  }, [quests]);

  const handleClaim = useCallback(async (quest: TerangaQuest) => {
    const base = {
      code: quest.code,
      libelle: quest.libelle,
      description: quest.description,
      bonusCoins: quest.bonusCoins,
      icone: quest.icone,
    };

    if (!isAuthenticated) {
      setModalResult({
        ...base,
        claimed: false,
        message: 'Connectez-vous à votre compte Klef pour accomplir des quêtes.',
      });
      setIsModalOpen(true);
      return;
    }

    if (quest.unlocked) {
      setModalResult({
        ...base,
        claimed: true,
        alreadyClaimed: true,
        message: `Le badge « ${quest.libelle} » est déjà débloqué.`,
      });
      setIsModalOpen(true);
      return;
    }

    setLoadingCode(quest.code);
    try {
      const res = await terangaClubApi.claimQuest(quest.code);
      if (!mounted.current) return;
      setModalResult({
        ...base,
        libelle: res.libelle || quest.libelle,
        bonusCoins: res.bonusCoins || quest.bonusCoins,
        icone: res.icone || quest.icone,
        claimed: res.claimed,
        alreadyClaimed: res.alreadyClaimed,
        actionRequired: res.actionRequired,
        message: res.message,
      });
      setIsModalOpen(true);
      if (res.claimed) onClaimSuccess?.();
    } catch (err) {
      if (!mounted.current) return;
      setModalResult({
        ...base,
        claimed: false,
        message: err instanceof Error && err.message
          ? err.message
          : 'La vérification n’a pas abouti. Réessayez dans un instant.',
      });
      setIsModalOpen(true);
    } finally {
      if (mounted.current) setLoadingCode(null);
    }
  }, [isAuthenticated, onClaimSuccess]);

  return (
    <>
      <section className="card space-y-6 p-6 sm:p-8">

        {/* ── En-tête ──────────────────────────────────────────────────── */}

        <header className="space-y-4 border-b border-border pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border border-gold-200 bg-gold-50 text-gold-700">
                {/* `animate-pulse` tournait en continu sur l'icône d'en-tête. */}
                <Trophy className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Quêtes Teranga
                </h2>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  Accomplissez des défis pour gagner des Klef Coins.
                </p>
              </div>
            </div>

            {coinsRestants > 0 && (
              /* « Des bonus applicables directement » ne disait rien de
                 concret. Le montant restant à gagner, si. */
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-gold-200 bg-gold-50 px-3 py-1.5 text-xs font-semibold text-gold-700">
                <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="tabular-nums">{coinsRestants.toLocaleString('fr-FR')}</span> coins
                à gagner
              </span>
            )}
          </div>

          {total > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-foreground">
                  <span className="tabular-nums">{debloquees}</span> quête
                  {debloquees > 1 ? 's' : ''} sur <span className="tabular-nums">{total}</span>
                </span>
                {coinsGagnes > 0 && (
                  <span className="tabular-nums text-foreground-muted">
                    {coinsGagnes.toLocaleString('fr-FR')} coins gagnés
                  </span>
                )}
              </div>
              <div
                role="img"
                aria-label={`${debloquees} quêtes accomplies sur ${total}`}
                className="h-2 w-full overflow-hidden rounded-pill bg-background-alt"
              >
                <div
                  className="h-full rounded-pill bg-gold-400 transition-[width] duration-500"
                  style={{ width: `${(debloquees / total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {/* ── Grille ───────────────────────────────────────────────────── */}

        {quests.length === 0 ? (
          /* Aucun état vide n'était prévu : la section s'affichait avec un
             en-tête et une grille vide. */
          <p className="rounded-inner border border-dashed border-border bg-background-alt p-8 text-center text-xs text-foreground-muted">
            Aucune quête disponible pour le moment.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quests.map((quest) => {
              const isLoading = loadingCode === quest.code;
              const Icon = iconFor(quest.code);
              const done = quest.unlocked;

              return (
                <li
                  key={quest.code}
                  className={cn(
                    'flex flex-col justify-between gap-4 rounded-card border p-5 transition-[border-color,box-shadow] duration-200',
                    done
                      ? 'border-gold-200 bg-gold-50/40'
                      : 'border-border bg-background-card hover:border-border-hover hover:shadow-md',
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <span className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border',
                      done
                        ? 'border-gold-200 bg-gold-400 text-forest-900'
                        : 'border-border bg-background-alt text-foreground-muted',
                    )}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{quest.libelle}</h3>
                        {done && (
                          <span className="inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2 py-0.5 text-xs font-semibold text-gold-700">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Débloqué
                          </span>
                        )}
                        {/* Le badge « Disponible » portait une icône de cadenas :
                           deux signaux contradictoires. Une quête non accomplie
                           n'a pas besoin d'étiquette, son bouton le dit. */}
                      </div>
                      <p className="text-xs leading-relaxed text-foreground-muted">
                        {quest.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold tabular-nums',
                      done
                        ? 'border-gold-200 bg-gold-50 text-gold-700'
                        : 'border-border bg-background-alt text-foreground-muted',
                    )}>
                      <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                      {done ? '' : '+'}{Number(quest.bonusCoins).toLocaleString('fr-FR')} coins
                    </span>

                    <button
                      type="button"
                      onClick={() => handleClaim(quest)}
                      disabled={isLoading}
                      aria-label={done ? `Voir le badge ${quest.libelle}` : `Débloquer ${quest.libelle}`}
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-pill px-4 py-2 text-xs font-semibold transition-colors active:scale-[0.98] disabled:opacity-60',
                        done
                          ? 'border border-border bg-background-card text-foreground hover:bg-background-alt'
                          : 'bg-button-primary text-on-button-primary hover:bg-button-primary-hover',
                      )}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          Vérification…
                        </>
                      ) : done ? (
                        <>
                          <Award className="h-3.5 w-3.5" aria-hidden="true" />
                          Badge
                        </>
                      ) : (
                        <>
                          Débloquer
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <TerangaQuestClaimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={modalResult}
        userReferralCode={userId}
      />
    </>
  );
}