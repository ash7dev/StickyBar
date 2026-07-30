'use client';

import { CheckCircle2, Home, Zap, CircleDollarSign, Camera, MapPin, Sparkles, ShieldCheck, Moon, Loader2 } from 'lucide-react';
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

function fcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

function SummaryRow({ icon: Icon, label, value, accent = false }: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-border/60 last:border-0">
      {Icon && (
        <div className="w-9 h-9 rounded-inner bg-forest-950 text-lime-400 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-lime-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="eyebrow text-[10px] text-foreground-muted">{label}</p>
        <p className={cn(
          'text-sm font-bold truncate leading-tight mt-0.5',
          accent ? 'text-forest-600 font-extrabold' : 'text-foreground',
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function StepConfirmation({ onSubmit, isSubmitting, submitRef }: Props) {
  const { bien, annonce, equipements, photos } = useListingFormStore();

  const principalPhoto = photos.photos.find((p) => p.estPrincipale) ?? photos.photos[0];

  return (
    <div className="space-y-6">

      {/* Recap Card */}
      <div className="card p-0 overflow-hidden shadow-xl border border-border">

        {/* Hero Section */}
        {principalPhoto ? (
          <div className="aspect-[16/8] relative overflow-hidden bg-background-alt">
            <img
              src={principalPhoto.previewUrl}
              alt="Photo principale"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="absolute top-4 right-4">
              <div className="px-3 py-1.5 rounded-pill bg-forest-950/80 border border-lime-400/30 text-lime-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                <span>Aperçu final</span>
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="badge-verified shadow-xs">
                  {bien.sousType ?? TYPE_LABELS[bien.type ?? ''] ?? 'Logement'}
                </span>
                <span className="flex items-center gap-1 text-white/80 text-xs font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  {bien.ville}
                </span>
              </div>
              <h2 className="text-white font-display font-bold text-xl sm:text-2xl leading-tight line-clamp-2">
                {annonce.titre}
              </h2>
            </div>
          </div>
        ) : (
          <div className="aspect-[16/8] bg-background-alt flex flex-col items-center justify-center gap-2">
            <Camera className="w-8 h-8 text-foreground-muted" />
            <p className="eyebrow text-foreground-muted">Aucune photo principale</p>
          </div>
        )}

        {/* Details Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <SummaryRow
              icon={CircleDollarSign}
              label="Prix de base"
              value={`${fcfa(annonce.prixBase ?? 0)} FCFA / nuit`}
              accent
            />
            <SummaryRow
              icon={Home}
              label="Capacité d'accueil"
              value={`${bien.capaciteMax ?? '—'} personnes`}
            />
            <SummaryRow
              icon={Camera}
              label="Photos de l'annonce"
              value={`${photos.photos.length} photo${photos.photos.length > 1 ? 's' : ''}`}
            />
            <SummaryRow
              icon={Zap}
              label="Équipements inclus"
              value={`${equipements.equipements.length} sélectionné${equipements.equipements.length > 1 ? 's' : ''}`}
            />
            <SummaryRow
              icon={Moon}
              label="Séjour minimum"
              value={`${annonce.nuitesMinimum ?? 1} nuit${(annonce.nuitesMinimum ?? 1) > 1 ? 's' : ''}`}
            />
            <SummaryRow
              icon={ShieldCheck}
              label="Statut initial"
              value="En attente de validation"
            />
          </div>
        </div>
      </div>

      {/* Banner validation */}
      <div className="section-inverse p-5 rounded-card border border-forest-800 flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-inner bg-forest-900 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="eyebrow text-lime-300">Soumission pour validation</p>
          <p className="text-xs text-on-inverse-muted leading-relaxed font-medium">
            Votre annonce sera transmise à nos modérateurs ImmoLoc. Elle sera révisée et activée sous 24h ouvrées.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <button
        ref={submitRef}
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className={cn(
          'btn-action text-sm py-4 w-full justify-center shadow-action cursor-pointer font-bold',
          isSubmitting && 'opacity-50 cursor-not-allowed',
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Traitement et soumission en cours…</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>Soumettre l&apos;annonce pour validation</span>
          </>
        )}
      </button>
    </div>
  );
}
