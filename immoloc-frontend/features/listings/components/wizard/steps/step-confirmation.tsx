'use client';

import { CheckCircle2, Home, Zap, CircleDollarSign, Camera, ScrollText, MapPin, Sparkles, ShieldCheck, Moon } from 'lucide-react';
import { useListingFormStore } from '@/stores/listing-form.store';
import { cn } from '@/lib/utils/cn';

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  VILLA:       'Villa',
  CHAMBRE:     'Chambre',
  AUTRES:      'Autres',
};

interface Props {
  onSubmit: () => void;
  isSubmitting: boolean;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

function SummaryRow({ icon: Icon, label, value, accent = false, iconBg }: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
  iconBg?: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4 group transition-all">
      {Icon && (
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
          iconBg ?? 'bg-white/50 text-neutral-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
        )}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className={cn('flex-1 min-w-0', !Icon && 'pl-1')}>
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">{label}</p>
        <p className={cn(
          'text-[13px] font-bold truncate leading-tight', 
          accent ? 'text-emerald-600' : 'text-neutral-900'
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function StepConfirmation({ onSubmit, isSubmitting, submitRef }: Props) {
  const { bien, annonce, equipements, photos, conditions } = useListingFormStore();

  const principalPhoto = photos.photos.find((p) => p.estPrincipale) ?? photos.photos[0];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">

      {/* ── Recap Card (Glass) ──────────────────────────────── */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white shadow-2xl shadow-emerald-500/5 overflow-hidden">
        
        {/* Hero Section */}
        {principalPhoto ? (
          <div className="aspect-[16/8] relative overflow-hidden">
            <img 
              src={principalPhoto.previewUrl} 
              alt="Photo principale" 
              className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                Aperçu final
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
                  {bien.sousType ?? TYPE_LABELS[bien.type ?? ''] ?? 'Bien'}
                </div>
                <div className="flex items-center gap-1 text-white/80 text-[10px] font-bold">
                  <MapPin className="w-3 h-3" />
                  {bien.ville}
                </div>
              </div>
              <h2 className="text-white font-black text-2xl sm:text-3xl leading-tight tracking-tight uppercase">
                {annonce.titre}
              </h2>
            </div>
          </div>
        ) : (
          <div className="aspect-[16/8] bg-neutral-100 flex flex-col items-center justify-center gap-3">
            <Camera className="w-10 h-10 text-neutral-300" />
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Aucune photo sélectionnée</p>
          </div>
        )}

        {/* Details Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-neutral-100">
            <SummaryRow 
              icon={CircleDollarSign}
              label="Prix par nuit" 
              value={`${annonce.prixBase?.toLocaleString() ?? '—'} FCFA`} 
              accent 
            />
            <SummaryRow 
              icon={Home} 
              label="Capacité max" 
              value={`${bien.capaciteMax ?? '—'} personnes`} 
            />
            <SummaryRow 
              icon={Camera} 
              label="Photos jointes" 
              value={`${photos.photos.length} photo${photos.photos.length > 1 ? 's' : ''}`} 
            />
            <SummaryRow 
              icon={Zap} 
              label="Équipements" 
              value={`${equipements.equipements.length} sélectionné${equipements.equipements.length > 1 ? 's' : ''}`} 
            />
            <SummaryRow 
              icon={Moon} 
              label="Séjour minimum" 
              value={`${annonce.nuitesMinimum ?? 1} nuit${(annonce.nuitesMinimum ?? 1) > 1 ? 's' : ''}`} 
            />
            <SummaryRow 
              icon={ShieldCheck} 
              label="Statut" 
              value="Vérification requise" 
            />
          </div>
        </div>
      </div>

      {/* ── Status Banner (Glass) ─────────────────────────── */}
      <div className="relative group">
        <div className="absolute inset-0 bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex gap-4 p-5 bg-white/40 backdrop-blur-md rounded-3xl border border-white shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 p-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">Soumission en attente de validation</p>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Votre annonce sera d'abord enregistrée en mode brouillon. Elle sera vérifiée par notre équipe sous 24h avant sa mise en ligne publique.
            </p>
          </div>
        </div>
      </div>

      {/* ── Submit Button ──────────────────────────────────── */}
      <button
        ref={submitRef}
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className={cn(
          'relative w-full flex items-center justify-center gap-3 py-5 rounded-[24px] text-white font-black text-base transition-all duration-500 overflow-hidden group',
          isSubmitting
            ? 'bg-neutral-200 cursor-not-allowed text-neutral-400'
            : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_12px_40px_rgba(77,150,255,0.3)] hover:shadow-[0_15px_50px_rgba(77,150,255,0.4)] hover:-translate-y-1 active:scale-[0.98]',
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
        
        {isSubmitting ? (
          <>
            <span className="w-5 h-5 rounded-full border-3 border-neutral-300 border-t-emerald-500 animate-spin" />
            <span>Enregistrement...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="uppercase tracking-widest">Confirmer la publication</span>
          </>
        )}
      </button>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
