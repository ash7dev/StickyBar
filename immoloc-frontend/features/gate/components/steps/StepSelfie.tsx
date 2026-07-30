'use client';

import { useState } from 'react';
import { Camera, CheckCircle2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { useToastError } from '@/lib/hooks/use-toast-error';

interface Props {
  onDone: () => void;
}

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
      await new Promise(resolve => setTimeout(resolve, 1500));

      const token = (await refreshIfNeeded()) ?? '';

      // En mode démo, on valide directement le selfie sans upload
      await nestFetch(NEST_API.KYC.SUBMIT_SELFIE, {
        method: 'POST',
        token,
        body: JSON.stringify({
          kycSelfieUrl: 'https://via.placeholder.com/800x1200/041912/D3F26E?text=Selfie+Verification+Klef',
          kycSelfiePublicId: 'demo_selfie_' + Date.now(),
          selfieFaceDetected: true,
          selfieMatchScore: 0.95,
        }),
      });

      // Mettre à jour le store
      setGateStatus({ selfieFaceDetected: true });
      showSuccess('Selfie validé !', 'Votre photo a été vérifiée avec succès par Klef');
      onDone();
    } catch (e: unknown) {
      showError(e);
    } finally {
      setLoading(false);
      setSimulating(false);
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Mode simulation - Zone d'affichage signature sombre */}
      <div className="section-inverse p-6 sm:p-7 space-y-4 relative overflow-hidden border border-forest-800">
        <div className="flex items-center gap-2.5 justify-center">
          <Sparkles className="w-4 h-4 text-lime-400" />
          <p className="eyebrow text-lime-300">
            Biométrie Visage Klef
          </p>
        </div>

        {/* Cadre photo simulation */}
        <div className="relative aspect-[3/4] max-w-[220px] mx-auto bg-forest-950 rounded-inner border-2 border-lime-400/30 overflow-hidden shadow-lg flex flex-col items-center justify-center p-4 text-center">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-lime-400/40 mb-3 flex items-center justify-center bg-forest-900/60">
            <Camera className="w-8 h-8 text-lime-400/70" />
          </div>
          <p className="text-lime-300 text-xs font-bold mb-1">
            Détection automatique
          </p>
          <p className="text-on-inverse-muted text-[10px] leading-relaxed">
            Cadrez votre visage au centre du repère
          </p>

          {simulating && (
            <div className="absolute inset-0 bg-forest-950/80 backdrop-blur-xs flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 text-lime-400 animate-spin mx-auto" />
                <p className="text-lime-300 text-xs font-bold">
                  Analyse biométrique…
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-forest-900/80 border border-forest-800 rounded-inner p-3.5 space-y-2">
          <p className="text-[10px] font-bold text-lime-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
            Consignes de capture
          </p>
          <ul className="text-[11px] text-on-inverse-muted space-y-1 leading-relaxed">
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-lime-400 shrink-0" />
              <span>Visage bien éclairé de face</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-lime-400 shrink-0" />
              <span>Retirez lunettes de soleil et accessoires</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Info - Mode simulation */}
      <div className="flex items-start gap-3 p-3.5 rounded-inner bg-gold-50 border border-gold-200 dark:bg-gold-500/10 text-gold-800 dark:text-gold-300 text-xs font-medium">
        <AlertCircle className="w-4 h-4 text-gold-600 dark:text-gold-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          La détection faciale est simulée pour l&apos;environnement de test Klef.
        </p>
      </div>

      {/* Bouton de validation */}
      <button
        type="button"
        onClick={handleDemoValidation}
        disabled={loading}
        className="btn-action w-full text-xs justify-center cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Validation biométrique en cours…</>
        ) : (
          <><CheckCircle2 className="w-4 h-4" /> Valider mon selfie</>
        )}
      </button>

      {/* Note de sécurité */}
      <p className="text-center text-[10px] text-foreground-muted leading-relaxed">
        Vos données biométriques sont chiffrées et sécurisées selon les normes de protection des données.
      </p>
    </div>
  );
}
