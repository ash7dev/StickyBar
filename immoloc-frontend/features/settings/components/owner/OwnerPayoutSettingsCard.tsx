'use client';

import { useState } from 'react';
import { Wallet, Smartphone, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  telephoneInitial?: string;
}

export function OwnerPayoutSettingsCard({ telephoneInitial = '' }: Props) {
  const [methode, setMethode] = useState<'WAVE' | 'ORANGE_MONEY'>('WAVE');
  const [numeroRetrait, setNumeroRetrait] = useState(telephoneInitial);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/80">
        <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shrink-0 shadow-xs">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Coordonnées de Retrait</h2>
          <p className="text-xs text-foreground-muted">Recevez les loyers de vos locations directement sur Mobile Money</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-3 p-3.5 rounded-inner bg-success-50 border border-success-500/30 text-success-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
          <span>Coordonnées de retrait mises à jour.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="eyebrow block mb-2">Opérateur par défaut</label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setMethode('WAVE')}
              className={cn(
                'flex items-center justify-center gap-2 py-3 px-4 rounded-pill border text-xs font-semibold transition-all',
                methode === 'WAVE'
                  ? 'bg-forest-950 text-lime-300 border-forest-900 shadow-sm'
                  : 'bg-background-alt text-foreground-muted border-border hover:bg-background-card',
              )}
            >
              <Smartphone className="w-4 h-4 text-sky-400" />
              Wave Senegal
            </button>

            <button
              type="button"
              onClick={() => setMethode('ORANGE_MONEY')}
              className={cn(
                'flex items-center justify-center gap-2 py-3 px-4 rounded-pill border text-xs font-semibold transition-all',
                methode === 'ORANGE_MONEY'
                  ? 'bg-forest-950 text-lime-300 border-forest-900 shadow-sm'
                  : 'bg-background-alt text-foreground-muted border-border hover:bg-background-card',
              )}
            >
              <Smartphone className="w-4 h-4 text-orange-400" />
              Orange Money
            </button>
          </div>
        </div>

        <div className="max-w-md">
          <label className="eyebrow block mb-2">Numéro de Réception par défaut</label>
          <input
            type="text"
            value={numeroRetrait}
            onChange={(e) => setNumeroRetrait(e.target.value)}
            placeholder="77 123 45 67"
            className="w-full px-4 py-3 rounded-field bg-background-alt border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-500/20 transition-all"
          />
          <p className="text-xs text-foreground-muted mt-1.5">
            Ce numéro sera automatiquement sélectionné lors de vos demandes de retrait sur votre portefeuille.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-action px-6 text-xs justify-center cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
            ) : (
              <><Save className="w-4 h-4" /> Enregistrer</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
