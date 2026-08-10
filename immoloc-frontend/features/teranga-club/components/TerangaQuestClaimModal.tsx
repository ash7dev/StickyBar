'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Coins, CheckCircle2, ChevronRight, X, Copy, Check, Share2, Compass, MessageSquare, Key } from 'lucide-react';

export interface QuestClaimResult {
  code: string;
  libelle: string;
  description: string;
  bonusCoins: number;
  icone: string;
  claimed: boolean;
  alreadyClaimed?: boolean;
  actionRequired?: 'RESERVE' | 'REVIEW' | 'EXPLORE' | 'SHARE';
  message: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: QuestClaimResult | null;
  userReferralCode?: string;
}

export function TerangaQuestClaimModal({ isOpen, onClose, result, userReferralCode }: Props) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${userReferralCode || 'teranga'}`
    : 'https://klef.sn';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Rejoins-moi sur Klef et profite de logements d'exception au Sénégal avec cashback Teranga ! 🏠✨ ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

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

        {/* ══ CAS 1 : SUCCÈS - QUÊTE DÉBLOQUÉE ══ */}
        {result.claimed ? (
          <>
            <div className="bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800 text-white p-6 pt-8 text-center relative overflow-hidden">
              <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-lime-400/20 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gold-400/20 blur-2xl" />

              <div className="relative mx-auto mb-3 w-16 h-16 rounded-2xl bg-gradient-to-tr from-lime-400 to-gold-300 p-0.5 shadow-lg animate-bounce">
                <div className="w-full h-full rounded-[14px] bg-forest-950 flex items-center justify-center text-3xl">
                  {result.icone}
                </div>
              </div>

              <h3 className="font-display text-xl font-extrabold text-white">
                🎉 Quête Accomplie !
              </h3>
              <p className="text-xs text-forest-200 mt-1 font-medium">
                Vous avez débloqué le badge « {result.libelle} »
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl border border-lime-500/30 bg-gradient-to-br from-lime-500/10 via-forest-50/40 to-background-card space-y-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-lime-400/20 border border-lime-400/30 text-forest-800 text-xs font-bold">
                  <Coins className="w-4 h-4 text-forest-800" />
                  <span>BONUS CRÉDITÉ</span>
                </div>

                <div className="font-display text-3xl font-black text-forest-900 tracking-tight">
                  +{result.bonusCoins.toLocaleString('fr-FR')} Coins
                </div>

                <p className="text-xs text-foreground-muted leading-relaxed">
                  {result.message}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-5 rounded-pill bg-forest-900 hover:bg-forest-950 text-white font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Profiter de mes Klef Coins</span>
                <ChevronRight className="w-4 h-4 text-lime-300" />
              </button>
            </div>
          </>
        ) : (
          /* ══ CAS 2 : ACTION REQUISE ══ */
          <>
            <div className="bg-gradient-to-br from-forest-950 to-forest-900 text-white p-6 pt-7 text-center relative overflow-hidden">
              <div className="relative mx-auto mb-3 w-14 h-14 rounded-2xl bg-forest-800/80 border border-forest-600/50 flex items-center justify-center text-3xl shadow-inner">
                {result.icone}
              </div>

              <h3 className="font-display text-lg font-bold text-white">
                {result.libelle}
              </h3>
              <p className="text-xs text-forest-200 mt-0.5">
                Bonus à la clé : <span className="font-extrabold text-lime-300">+{result.bonusCoins} Coins</span>
              </p>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs text-foreground-muted leading-relaxed text-center">
                {result.message}
              </p>

              {/* Action dynamique selon la quête */}
              {result.code === 'SUPER_PARRAIN' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-border bg-background-alt space-y-2">
                    <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                      Votre lien de parrainage unique
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-background-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-3 py-2 rounded-lg bg-forest-900 text-white text-xs font-semibold hover:bg-forest-950 transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-lime-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="w-full py-3 px-4 rounded-pill bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager sur WhatsApp</span>
                  </button>
                </div>
              ) : result.actionRequired === 'RESERVE' ? (
                <Link
                  href="/"
                  onClick={onClose}
                  className="w-full py-3.5 px-5 rounded-pill bg-forest-900 hover:bg-forest-950 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Key className="w-4 h-4 text-lime-300" />
                  <span>Réserver mon 1er séjour</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>
              ) : result.actionRequired === 'REVIEW' ? (
                <Link
                  href="/reservations"
                  onClick={onClose}
                  className="w-full py-3.5 px-5 rounded-pill bg-forest-900 hover:bg-forest-950 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-lime-300" />
                  <span>Rédiger un avis sur mon séjour</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>
              ) : (
                <Link
                  href="/recherche?ville=Saly"
                  onClick={onClose}
                  className="w-full py-3.5 px-5 rounded-pill bg-forest-900 hover:bg-forest-950 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Compass className="w-4 h-4 text-lime-300" />
                  <span>Découvrir la Petite Côte</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors text-center"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
