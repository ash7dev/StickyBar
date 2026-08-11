'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ─── Dates ───────────────────────────────────────────────────────────────
   Tout est en date CIVILE locale. `toISOString()` convertit en UTC : depuis
   l'Europe, minuit local devient la veille 22 h, et la plage part décalée
   d'un jour. Le Sénégal étant à UTC+0, le bug serait invisible en test local
   et bien réel pour un admin en déplacement. */

export const toLocalISO = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const parseLocalISO = (iso?: string): Date | undefined => {
    if (!iso) return undefined;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

export const fmtDateFr = (iso?: string) => {
    const d = parseLocalISO(iso);
    return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
};

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Grille de 6 semaines, lundi en première colonne. */
function grilleDuMois(annee: number, mois: number): (Date | null)[] {
    const premier = new Date(annee, mois, 1);
    const decalage = (premier.getDay() + 6) % 7; // dimanche = 0 → 6
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    const cases: (Date | null)[] = Array.from({ length: decalage }, () => null);
    for (let j = 1; j <= nbJours; j++) cases.push(new Date(annee, mois, j));
    while (cases.length % 7 !== 0) cases.push(null);
    return cases;
}

interface Props {
    start?: string;
    end?: string;
    onChange: (start: string, end: string) => void;
    /** Dernière date sélectionnable. Par défaut aujourd'hui : un rapport
        financier ne se projette pas dans le futur. */
    max?: string;
    min?: string;
    onClose?: () => void;
}

export function DateRangeCalendar({ start, end, onChange, max, min, onClose }: Props) {
    const aujourdhui = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const maxDate = parseLocalISO(max) ?? aujourdhui;
    const minDate = parseLocalISO(min);

    const [debut, setDebut] = useState<string | undefined>(start);
    const [fin, setFin] = useState<string | undefined>(end);
    const [apercu, setApercu] = useState<string | undefined>();
    const [curseur, setCurseur] = useState(() => {
        const base = parseLocalISO(start) ?? aujourdhui;
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });
    const [focus, setFocus] = useState<string>(() => start ?? toLocalISO(aujourdhui));

    const grilleRef = useRef<HTMLDivElement>(null);

    // Une plage arrivée depuis l'extérieur réaligne l'affichage.
    useEffect(() => {
        setDebut(start);
        setFin(end);
    }, [start, end]);

    useEffect(() => {
        if (!onClose) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const desactive = (d: Date) =>
        d.getTime() > maxDate.getTime() || (minDate ? d.getTime() < minDate.getTime() : false);

    function choisir(iso: string) {
        // Pas de plage en cours, ou plage complète : on repart d'un début.
        if (!debut || (debut && fin)) {
            setDebut(iso);
            setFin(undefined);
            return;
        }
        if (iso < debut) {
            // Cliquer avant le début redéfinit le début plutôt que d'inverser la
            // plage en silence.
            setDebut(iso);
            return;
        }
        setFin(iso);
        onChange(debut, iso);
    }

    /* Navigation clavier complète : un sélecteur de dates qui ne se pilote qu'à
       la souris exclut la moitié des usages sur un écran d'analyse. */
    function auClavier(e: React.KeyboardEvent) {
        const courant = parseLocalISO(focus);
        if (!courant) return;
        const deplacer = (jours: number) => {
            const suivant = new Date(courant);
            suivant.setDate(courant.getDate() + jours);
            const iso = toLocalISO(suivant);
            setFocus(iso);
            setCurseur(new Date(suivant.getFullYear(), suivant.getMonth(), 1));
            requestAnimationFrame(() => {
                grilleRef.current?.querySelector<HTMLElement>(`[data-jour="${iso}"]`)?.focus();
            });
        };

        switch (e.key) {
            case 'ArrowLeft': e.preventDefault(); deplacer(-1); break;
            case 'ArrowRight': e.preventDefault(); deplacer(1); break;
            case 'ArrowUp': e.preventDefault(); deplacer(-7); break;
            case 'ArrowDown': e.preventDefault(); deplacer(7); break;
            case 'PageUp': e.preventDefault(); deplacer(-28); break;
            case 'PageDown': e.preventDefault(); deplacer(28); break;
            case 'Enter':
            case ' ': {
                e.preventDefault();
                if (!desactive(courant)) choisir(focus);
                break;
            }
            default:
        }
    }

    const borneHaute = fin ?? (debut && apercu && apercu > debut ? apercu : undefined);

    const mois = [curseur, new Date(curseur.getFullYear(), curseur.getMonth() + 1, 1)];
    const moisSuivantPossible =
        new Date(curseur.getFullYear(), curseur.getMonth() + 1, 1).getTime() <=
        new Date(maxDate.getFullYear(), maxDate.getMonth(), 1).getTime();

    return (
        <div className="space-y-3">
            {/* ── Navigation ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setCurseur(new Date(curseur.getFullYear(), curseur.getMonth() - 1, 1))}
                    aria-label="Mois précédent"
                    className="flex h-8 w-8 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>

                <p aria-live="polite" className="text-sm font-semibold capitalize text-foreground">
                    {curseur.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    <span className="hidden sm:inline">
                        {' – '}
                        {mois[1].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                </p>

                <button
                    type="button"
                    disabled={!moisSuivantPossible}
                    onClick={() => setCurseur(new Date(curseur.getFullYear(), curseur.getMonth() + 1, 1))}
                    aria-label="Mois suivant"
                    className="flex h-8 w-8 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
            </div>

            {/* ── Grilles ────────────────────────────────────────────────────── */}
            <div
                ref={grilleRef}
                onKeyDown={auClavier}
                className="grid gap-5 sm:grid-cols-2"
                role="application"
                aria-label="Choisir une plage de dates"
            >
                {mois.map((m, idxMois) => (
                    <div key={`${m.getFullYear()}-${m.getMonth()}`} className={idxMois === 1 ? 'hidden sm:block' : ''}>
                        <p className="mb-2 text-center text-xs font-semibold capitalize text-foreground-muted sm:hidden">
                            {m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </p>

                        <div className="mb-1 grid grid-cols-7">
                            {JOURS.map((j, i) => (
                                <span key={i} className="text-center text-xs text-foreground-muted" aria-hidden>
                                    {j}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-0.5">
                            {grilleDuMois(m.getFullYear(), m.getMonth()).map((jour, i) => {
                                if (!jour) return <span key={`v-${i}`} />;

                                const iso = toLocalISO(jour);
                                const bloque = desactive(jour);
                                const estDebut = iso === debut;
                                const estFin = iso === fin;
                                const dansPlage =
                                    !!debut && !!borneHaute && iso > debut && iso < borneHaute;
                                const estAujourdhui = iso === toLocalISO(aujourdhui);
                                const extremite = estDebut || estFin;

                                return (
                                    <button
                                        key={iso}
                                        type="button"
                                        data-jour={iso}
                                        disabled={bloque}
                                        tabIndex={iso === focus ? 0 : -1}
                                        aria-label={fmtDateFr(iso)}
                                        aria-pressed={extremite}
                                        onFocus={() => setFocus(iso)}
                                        onClick={() => choisir(iso)}
                                        onMouseEnter={() => setApercu(iso)}
                                        onMouseLeave={() => setApercu(undefined)}
                                        className={cn(
                                            'relative h-9 text-xs font-medium tabular-nums transition-colors',
                                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                                            bloque && 'cursor-not-allowed text-neutral-400',
                                            !bloque && !extremite && !dansPlage && 'text-foreground hover:bg-background-alt',
                                            dansPlage && 'bg-forest-50 text-forest-700',
                                            extremite && 'bg-forest-600 font-semibold text-neutral-0',
                                            // Les extrémités arrondissent du bon côté ; le milieu
                                            // reste carré pour que la plage se lise d'un bloc.
                                            estDebut && !estFin && 'rounded-l-pill',
                                            estFin && !estDebut && 'rounded-r-pill',
                                            estDebut && estFin && 'rounded-pill',
                                            !extremite && !dansPlage && 'rounded-pill',
                                        )}
                                    >
                                        {jour.getDate()}
                                        {estAujourdhui && !extremite && (
                                            <span
                                                aria-hidden
                                                className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-pill bg-forest-600"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Résumé ─────────────────────────────────────────────────────── */}
            <p className="border-t border-border pt-3 text-xs text-foreground-muted">
                {debut && fin ? (
                    <>
                        Du <strong className="font-semibold text-foreground">{fmtDateFr(debut)}</strong> au{' '}
                        <strong className="font-semibold text-foreground">{fmtDateFr(fin)}</strong>
                    </>
                ) : debut ? (
                    <>
                        Début au <strong className="font-semibold text-foreground">{fmtDateFr(debut)}</strong> —
                        choisissez la date de fin.
                    </>
                ) : (
                    'Choisissez la date de début.'
                )}
            </p>
        </div>
    );
}