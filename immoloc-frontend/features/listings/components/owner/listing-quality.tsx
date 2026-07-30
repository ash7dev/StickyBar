'use client';

import { AlertCircle, Check } from 'lucide-react';
import type { ListingDetail } from '@/lib/nestjs/types';
import { cn } from '@/lib/utils/cn';

/* ---------------------------------------------------------------------------
   Le score de qualite affichait « 62% » et s'arretait la.

   Un indicateur sans action est de la decoration : le proprietaire voit qu'il
   n'est pas au maximum, mais n'a aucun moyen de savoir ce qui manque. Ici le
   score est la somme de criteres nommes, et ceux qui ne sont pas remplis sont
   affiches comme une liste de choses a faire.
   --------------------------------------------------------------------------- */

interface Criterion {
    label: string;
    hint: string;
    weight: number;
    done: boolean;
}

export function buildCriteria(listing: ListingDetail): Criterion[] {
    const photos = listing.photos?.length ?? 0;
    return [
        {
            label: 'Titre descriptif',
            hint: 'Au moins 20 caractères, avec le quartier et l’atout principal.',
            weight: 20,
            done: (listing.titre?.length ?? 0) >= 20,
        },
        {
            label: 'Description détaillée',
            hint: 'Au moins 200 caractères : ambiance, équipements, accès, voisinage.',
            weight: 20,
            done: (listing.description?.length ?? 0) >= 200,
        },
        {
            label: `Cinq photos minimum (${photos}/5)`,
            hint: 'Une par pièce, plus l’entrée et la vue. Les annonces sans salle d’eau reçoivent moins de demandes.',
            weight: 25,
            done: photos >= 5,
        },
        {
            label: 'Cinq équipements renseignés',
            hint: 'Groupe électrogène, eau chaude, climatisation : ce sont ceux qui décident.',
            weight: 20,
            done: (listing.equipements?.length ?? 0) >= 5,
        },
        {
            label: 'Règles de la maison',
            hint: 'Évite les malentendus à l’arrivée, et les litiges après.',
            weight: 10,
            done: (listing.reglesMaison?.length ?? 0) >= 20,
        },
        {
            label: 'Au moins un tarif dégressif',
            hint: 'Un prix réduit dès 7 nuits remplit les périodes creuses.',
            weight: 5,
            done: (listing.tarifsNuits?.length ?? 0) > 0 || (listing.tarifsPersonnes?.length ?? 0) > 0,
        },
    ];
}

export const computeQuality = (listing: ListingDetail) =>
    Math.round(buildCriteria(listing).reduce((s, c) => s + (c.done ? c.weight : 0), 0));

export function QualityPanel({ listing }: { listing: ListingDetail }) {
    const criteria = buildCriteria(listing);
    const score = criteria.reduce((s, c) => s + (c.done ? c.weight : 0), 0);
    const missing = criteria.filter((c) => !c.done);

    const label = score >= 80 ? 'Excellente' : score >= 50 ? 'Correcte' : 'À compléter';
    const tone = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error';

    return (
        <div className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm">
            <div>
                <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-foreground-faint">
                    Qualité de l’annonce
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                    {/* Le score etait dans un carre forest-950 a chiffres lime : le bloc
              le plus sombre d'une colonne claire, pour une donnee informative. */}
                    <span className="text-3xl font-semibold tabular-nums tracking-[-0.02em] text-forest-900">
                        {score}
                        <span className="text-lg text-foreground-muted">%</span>
                    </span>
                    <span className={cn(
                        'rounded-pill px-2 py-0.5 text-[0.6875rem] font-semibold',
                        tone === 'success' && 'bg-success-50 text-success-700',
                        tone === 'warning' && 'bg-warning-50 text-warning-700',
                        tone === 'error' && 'bg-error-50 text-error-700',
                    )}>
                        {label}
                    </span>
                </div>

                <div
                    className="mt-3 h-1.5 overflow-hidden rounded-pill bg-neutral-100"
                    role="progressbar"
                    aria-valuenow={score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Qualité de l’annonce"
                >
                    <div
                        className={cn(
                            'h-full rounded-pill transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                            tone === 'success' ? 'bg-success-500' : tone === 'warning' ? 'bg-warning-500' : 'bg-error-500',
                        )}
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            {missing.length > 0 ? (
                <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-foreground">
                        {missing.length === 1 ? 'Il reste un point' : `Il reste ${missing.length} points`}
                    </p>
                    <ul className="mt-3 space-y-3">
                        {missing.map((c) => (
                            <li key={c.label} className="flex items-start gap-2.5">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" aria-hidden="true" />
                                <span className="min-w-0">
                                    <span className="block text-xs font-medium text-foreground">{c.label}</span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-foreground-muted">{c.hint}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="flex items-start gap-2.5 border-t border-border pt-4 text-xs leading-relaxed text-success-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    Tous les critères sont remplis. Votre annonce est prête à convertir.
                </p>
            )}
        </div>
    );
}