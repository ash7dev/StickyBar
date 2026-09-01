'use client';

import {
  CheckCircle2, Home, Zap, CircleDollarSign, Camera, MapPin,
  Sparkles, ShieldCheck, Moon, Loader2, Film, User,
} from 'lucide-react';
import { useListingFormStore } from '@/stores/listing-form.store';
import { cn } from '@/lib/utils/cn';

const MARKUP = 1.07;

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement', VILLA: 'Villa', CHAMBRE: 'Chambre', AUTRES: 'Autres',
};

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));

interface Props {
  onSubmit: () => void;
  isSubmitting: boolean;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

function SummaryRow({ icon: Icon, label, value, hint }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-border py-3.5 last:border-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="eyebrow text-foreground-muted">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-semibold leading-tight text-foreground">
          {value}
        </dd>
        {hint && <p className="mt-0.5 text-xs text-foreground-muted">{hint}</p>}
      </div>
    </div>
  );
}

export function StepConfirmation({ onSubmit, isSubmitting, submitRef }: Props) {
  const { bien, annonce, equipements, photos, video, proprietaire } = useListingFormStore();

  const principalPhoto = photos.photos.find((p) => p.estPrincipale) ?? photos.photos[0];
  const prixBase = Number(annonce.prixBase) || 0;
  const prixPublic = Math.round(prixBase * MARKUP);
  const nbEquip = equipements.equipements.length;
  const nbPhotos = photos.photos.length;
  const nuits = annonce.nuitesMinimum ?? 1;

  return (
    <div className="space-y-6">

      <div className="card overflow-hidden p-0 shadow-md">

        {principalPhoto ? (
          <div className="relative aspect-[16/8] overflow-hidden bg-background-alt">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={principalPhoto.previewUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/25 to-transparent" />

            <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-pill border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-semibold text-neutral-50 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Aperçu
            </span>

            <div className="absolute inset-x-5 bottom-5">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-pill border border-white/20 bg-white/12 px-2.5 py-0.5 text-xs font-semibold text-neutral-50 backdrop-blur-sm">
                  {bien.sousType ?? TYPE_LABELS[bien.type ?? ''] ?? 'Logement'}
                </span>
                {bien.ville && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-neutral-50/85">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {bien.ville}
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl font-semibold leading-tight text-neutral-50 line-clamp-2 sm:text-2xl">
                {annonce.titre}
              </h2>
            </div>
          </div>
        ) : (
          <div className="flex aspect-[16/8] flex-col items-center justify-center gap-2 bg-background-alt">
            <Camera className="h-8 w-8 text-foreground-muted" aria-hidden="true" />
            <p className="eyebrow text-foreground-muted">Aucune photo de couverture</p>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-x-8 p-6 sm:grid-cols-2">
          {proprietaire && (proprietaire.prenom || proprietaire.telephone || proprietaire.existingUserId) && (
            <SummaryRow
              icon={User}
              label="Propriétaire du bien"
              value={proprietaire.mode === 'EXISTING'
                ? `Inscrit (${proprietaire.telephone || 'Rattaché'})`
                : `${proprietaire.prenom || ''} ${proprietaire.nom || ''} (${proprietaire.telephone})`}
              hint="Gestion conciergerie déléguée"
            />
          )}
          <SummaryRow
            icon={CircleDollarSign}
            label="Votre prix"
            value={`${fcfa(prixBase)} FCFA / nuit`}
            hint={`Affiché ${fcfa(prixPublic)} FCFA aux voyageurs`}
          />
          <SummaryRow icon={Home} label="Capacité" value={`${bien.capaciteMax ?? '—'} personnes`} />
          <SummaryRow icon={Camera} label="Photos" value={`${nbPhotos} photo${nbPhotos > 1 ? 's' : ''}`} />
          <SummaryRow icon={Film} label="Visite vidéo" value={video ? 'Ajoutée' : 'Aucune'} />
          <SummaryRow icon={Zap} label="Équipements" value={`${nbEquip} sélectionné${nbEquip > 1 ? 's' : ''}`} />
          <SummaryRow icon={Moon} label="Séjour minimum" value={`${nuits} nuit${nuits > 1 ? 's' : ''}`} />
          <SummaryRow icon={ShieldCheck} label="Statut" value="En attente de validation" />
        </dl>
      </div>

      <div className="section-inverse flex items-start gap-4 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-border-inverse bg-white/5 text-on-inverse-muted">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="eyebrow text-on-inverse-muted">Validation</p>
          <p className="text-xs leading-relaxed text-on-inverse-muted">
            {/* « nos modérateurs ImmoLoc » : ancien nom du produit, sur
               l'écran final de publication. */}
            Votre annonce est transmise à l’équipe Klef. Elle est révisée et activée sous 24 h
            ouvrées. Vous serez notifié dès sa mise en ligne.
          </p>
        </div>
      </div>

      <button
        ref={submitRef}
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="btn-action w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Soumission en cours…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            Soumettre pour validation
          </>
        )}
      </button>
    </div>
  );
}