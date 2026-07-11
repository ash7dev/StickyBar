'use client';

import { useState } from 'react';
import { Camera, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { useToastError } from '@/lib/hooks/use-toast-error';

interface Props {
  onDone: () => void;
}

// Mode SIMULATION pour éviter les bugs de caméra
const DEMO_MODE = true;

export function StepSelfie({ onDone }: Props) {
  const { setGateStatus } = useRoleStore();
  const { refreshIfNeeded } = useNestToken();
  const { showError, showSuccess } = useToastError();

  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  async function handleDemoValidation() {
    setSimulating(true);
    setLoading(true);

    try {
      // Simuler un délai de vérification
      await new Promise(resolve => setTimeout(resolve, 2000));

      const token = (await refreshIfNeeded()) ?? '';

      // En mode démo, on valide directement le selfie sans upload
      await nestFetch(NEST_API.KYC.SUBMIT_SELFIE, {
        method: 'POST',
        token,
        body: JSON.stringify({
          kycSelfieUrl: 'https://via.placeholder.com/800x1200/166534/FFFFFF?text=Selfie+Demo',
          kycSelfiePublicId: 'demo_selfie_' + Date.now(),
          selfieFaceDetected: true,
          selfieMatchScore: 0.95,
        }),
      });

      // Mettre à jour le store
      setGateStatus({ selfieFaceDetected: true });
      showSuccess('Selfie validé !', 'Votre photo a été envoyée avec succès');
      onDone();
    } catch (e: unknown) {
      showError(e);
    } finally {
      setLoading(false);
      setSimulating(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0">
      <div className="space-y-4 sm:space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            Selfie de vérification
          </h3>
          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed max-w-sm mx-auto">
            Prenez une photo de votre visage pour valider votre identité
          </p>
        </div>

        {/* Mode démo - Zone de simulation */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 justify-center">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <p className="text-sm font-black text-emerald-900 uppercase tracking-wide">
              Mode Simulation
            </p>
          </div>

          {/* Illustration selfie */}
          <div className="relative aspect-[3/4] max-w-[280px] sm:max-w-xs mx-auto bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white/30 border-dashed mb-4 flex items-center justify-center">
                <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-white/50" />
              </div>
              <p className="text-white/90 text-xs sm:text-sm font-bold mb-2">
                Simulation activée
              </p>
              <p className="text-white/70 text-[11px] sm:text-xs leading-relaxed">
                Cliquez sur &quot;Valider&quot; pour simuler la prise de selfie
              </p>
            </div>

            {simulating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  <p className="text-white text-sm font-bold">
                    Vérification en cours...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 space-y-2">
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Instructions
            </p>
            <ul className="text-[11px] sm:text-xs text-emerald-700 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Positionnez votre visage dans le cercle</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Assurez-vous d&apos;avoir un bon éclairage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Retirez lunettes, chapeau ou masque</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Regardez directement la caméra</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Info - Mode démo */}
        <div className="bg-gold-50 border border-gold-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-gold-900">
                Mode démo activé
              </p>
              <p className="text-[11px] sm:text-xs text-gold-700 leading-relaxed">
                La prise de selfie est simulée pour éviter les problèmes de caméra.
                En production, une vraie photo sera requise.
              </p>
            </div>
          </div>
        </div>

        {/* Bouton de validation */}
        <button
          onClick={handleDemoValidation}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-black rounded-2xl py-4 sm:py-5 transition-all duration-200 active:scale-[0.98] shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Vérification en cours…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Valider le selfie (Démo)
            </>
          )}
        </button>

        {/* Note de sécurité */}
        <p className="text-center text-[11px] sm:text-xs text-foreground-muted leading-relaxed px-4">
          Vos données sont sécurisées et utilisées uniquement pour la vérification d&apos;identité
        </p>
      </div>
    </div>
  );
}
