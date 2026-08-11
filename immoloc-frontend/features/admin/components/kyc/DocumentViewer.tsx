'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, ImageOff, Maximize2, Minus, Plus, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ZOOM_MIN = 1;
const ZOOM_MAX = 6;
const ZOOM_STEP = 0.4;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Visionneuse de pièce justificative.
 *
 * Deux partis pris qui viennent du métier, pas du style :
 *
 * · `object-contain`, jamais `object-cover`. Une CNI recadrée perd son numéro
 *   et sa date d'expiration — exactement les champs que l'agent doit lire.
 *   Le cadre s'adapte au document, pas l'inverse.
 *
 * · Rotation à 90°. La moitié des photos de pièces arrivent en paysage sur un
 *   téléphone tenu en portrait. Sans rotation, l'agent penche la tête ou
 *   rejette un dossier valable.
 *
 * Aucune animation sur le document lui-même : un `scale` au survol déplace ce
 * que l'œil est en train de lire.
 */
export function DocumentViewer({
    src,
    alt,
    emptyLabel = 'Document non téléversé',
    className,
}: {
    src?: string | null;
    alt: string;
    emptyLabel?: string;
    className?: string;
}) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const scene = useRef<HTMLDivElement>(null);
    const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

    const reset = useCallback(() => {
        setZoom(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
    }, []);

    // Changer de document remet la vue à plat : hériter du zoom précédent fait
    // atterrir l'agent sur un coin arbitraire de la pièce suivante.
    useEffect(reset, [src, reset]);

    const zoomBy = useCallback((delta: number) => {
        setZoom((z) => {
            const next = clamp(z + delta, ZOOM_MIN, ZOOM_MAX);
            if (next === ZOOM_MIN) setOffset({ x: 0, y: 0 });
            return next;
        });
    }, []);

    // Listener non passif : la molette doit zoomer la pièce, pas faire défiler
    // la modale sous elle. React n'expose pas `passive: false` sur onWheel.
    useEffect(() => {
        const el = scene.current;
        if (!el || !src) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            zoomBy(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [src, zoomBy]);

    const onPointerDown = (e: React.PointerEvent) => {
        if (zoom <= 1) return;
        drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const d = drag.current;
        if (!d) return;
        setOffset({ x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) });
    };

    const onPointerUp = () => {
        drag.current = null;
    };

    const boutonOutil =
        'flex h-8 w-8 items-center justify-center rounded-pill text-neutral-50 transition-colors hover:bg-neutral-0/15 disabled:opacity-35 disabled:hover:bg-transparent';

    if (!src) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-inner border border-dashed border-border-inverse-strong bg-forest-950 text-center',
                    className,
                )}
            >
                <ImageOff className="h-5 w-5 text-forest-300" aria-hidden />
                <p className="px-6 text-xs text-forest-200">{emptyLabel}</p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-inner border border-border-inverse-strong bg-forest-950',
                className,
            )}
        >
            <div
                ref={scene}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDoubleClick={() => (zoom > 1 ? reset() : setZoom(2.5))}
                className={cn(
                    'flex h-full w-full touch-none items-center justify-center overflow-hidden',
                    zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
                )}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    className="max-h-full max-w-full select-none object-contain"
                    style={{
                        transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
                        transition: drag.current ? 'none' : 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                />
            </div>

            {/* Barre d'outils : glass légitime, elle survole une photo. */}
            <div className="glass-dark absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-pill px-1.5 py-1">
                <button
                    type="button"
                    onClick={() => zoomBy(-ZOOM_STEP)}
                    disabled={zoom <= ZOOM_MIN}
                    className={boutonOutil}
                    aria-label="Réduire"
                >
                    <Minus className="h-4 w-4" aria-hidden />
                </button>

                <span className="w-11 text-center text-xs font-semibold tabular-nums text-neutral-50">
                    {Math.round(zoom * 100)}%
                </span>

                <button
                    type="button"
                    onClick={() => zoomBy(ZOOM_STEP)}
                    disabled={zoom >= ZOOM_MAX}
                    className={boutonOutil}
                    aria-label="Agrandir"
                >
                    <Plus className="h-4 w-4" aria-hidden />
                </button>

                <span aria-hidden className="mx-1 h-4 w-px bg-neutral-0/20" />

                <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className={boutonOutil}
                    aria-label="Pivoter de 90°"
                >
                    <RotateCw className="h-4 w-4" aria-hidden />
                </button>

                <button
                    type="button"
                    onClick={reset}
                    disabled={zoom === 1 && rotation === 0}
                    className={boutonOutil}
                    aria-label="Réinitialiser la vue"
                >
                    <Maximize2 className="h-4 w-4" aria-hidden />
                </button>

                <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={boutonOutil}
                    aria-label="Ouvrir en pleine résolution"
                >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
            </div>
        </div>
    );
}