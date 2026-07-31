'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ---------------------------------------------------------------------------
   Liste deroulante accessible (motif WAI-ARIA « select-only combobox »).

   Le composant precedent :
     - n'avait aucun support clavier (ni fleches, ni Echap, ni Entree)
     - gardait son panneau monte en permanence, masque par opacity-0 : la
       tabulation traversait toutes les options fermees, et les lecteurs
       d'ecran les annoncaient
     - n'exposait ni role, ni aria-expanded, ni aria-selected

   Ici le focus reste sur le declencheur et l'option active est designee par
   aria-activedescendant : c'est le motif recommande, plus robuste que de
   deplacer le focus dans la liste.
   ------------------------------------------------------------------------ */

interface Props {
    label: string;
    options: readonly string[];
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    /** 'top' force l'ouverture vers le haut. Par defaut, bascule automatique. */
    placement?: 'auto' | 'top' | 'bottom';
}

export function SelectField({
    label, options, value, onChange, placeholder,
    error, required, disabled, placement = 'auto',
}: Props) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [dropUp, setDropUp] = useState(placement === 'top');
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
    const [mounted, setMounted] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const typeahead = useRef({ buffer: '', timer: 0 });

    const uid = useId();
    const listId = `${uid}-list`;
    const labelId = `${uid}-label`;
    const errorId = `${uid}-error`;
    const optId = (i: number) => `${uid}-opt-${i}`;

    const selectedIndex = options.indexOf(value);

    // Montage côté client pour éviter hydration mismatch avec portal
    useEffect(() => {
        setMounted(true);
    }, []);

    /* Bascule automatique : si la place manque en dessous, on ouvre vers le
       haut. L'ancienne version imposait `placement` en dur par appel. */
    const measure = useCallback(() => {
        if (placement !== 'auto') { setDropUp(placement === 'top'); return; }
        const rect = btnRef.current?.getBoundingClientRect();
        if (!rect) return;
        const below = window.innerHeight - rect.bottom;
        setDropUp(below < 260 && rect.top > below);

        // Calcule la position pour le portal
        setDropdownPos({
            top: dropUp ? rect.top - 8 : rect.bottom + 8,
            left: rect.left,
            width: rect.width,
        });
    }, [placement, dropUp]);

    const openList = useCallback(() => {
        if (disabled) return;
        measure();
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
    }, [disabled, measure, selectedIndex]);

    const closeList = useCallback((refocus = true) => {
        setOpen(false);
        setActiveIndex(-1);
        if (refocus) btnRef.current?.focus();
    }, []);

    const commit = useCallback((i: number) => {
        const opt = options[i];
        if (opt === undefined) return;
        onChange(opt);
        closeList();
    }, [options, onChange, closeList]);

    // Clic exterieur (prend en compte le portal)
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            const isInsideRoot = rootRef.current?.contains(target);
            const isInsideList = listRef.current?.contains(target);
            if (!isInsideRoot && !isInsideList) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('touchstart', onDown);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('touchstart', onDown);
        };
    }, [open]);

    // Recalcule la position lors du scroll/redimensionnement
    useEffect(() => {
        if (!open) return;
        const updatePos = () => measure();
        window.addEventListener('scroll', updatePos, true);
        window.addEventListener('resize', updatePos);
        return () => {
            window.removeEventListener('scroll', updatePos, true);
            window.removeEventListener('resize', updatePos);
        };
    }, [open, measure]);

    // Maintient l'option active visible uniquement lors de la navigation au clavier
    useEffect(() => {
        if (!open || activeIndex < 0) return;
        // On ne scrollIntoView que si l'élément actif est désigné au clavier
        const activeElem = listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(optId(activeIndex))}`);
        if (activeElem && document.activeElement === btnRef.current) {
            activeElem.scrollIntoView({ block: 'nearest' });
        }
    }, [open, activeIndex]);

    function onKeyDown(e: React.KeyboardEvent) {
        if (disabled) return;

        if (!open) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
                openList();
            }
            return;
        }

        switch (e.key) {
            case 'Escape':
                e.preventDefault(); closeList(); return;
            case 'Tab':
                setOpen(false); return;
            case 'Enter':
            case ' ':
                e.preventDefault(); commit(activeIndex); return;
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % options.length); return;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex((i) => (i - 1 + options.length) % options.length); return;
            case 'Home':
                e.preventDefault(); setActiveIndex(0); return;
            case 'End':
                e.preventDefault(); setActiveIndex(options.length - 1); return;
        }

        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const t = typeahead.current;
            window.clearTimeout(t.timer);
            t.buffer += e.key.toLowerCase();
            t.timer = window.setTimeout(() => { t.buffer = ''; }, 600);

            const found = options.findIndex((o) =>
                o.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().startsWith(t.buffer),
            );
            if (found >= 0) setActiveIndex(found);
        }
    }

    const dropdownContent = open && mounted && dropdownPos && (
        <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            className={cn(
                'fixed z-[9999] max-h-72 overflow-y-auto overscroll-contain touch-pan-y rounded-card border border-border/80 bg-background-card py-1.5 shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95',
            )}
            style={{
                top: dropUp ? undefined : dropdownPos.top,
                bottom: dropUp ? `calc(100vh - ${dropdownPos.top}px)` : undefined,
                left: dropdownPos.left,
                width: dropdownPos.width,
            }}
        >
            {options.map((opt, i) => {
                const isSelected = opt === value;
                return (
                    <li
                        key={opt}
                        id={optId(i)}
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={(e) => {
                            e.preventDefault();
                        }}
                        onClick={() => commit(i)}
                        className={cn(
                            'flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm transition-colors',
                            isSelected
                                ? 'bg-forest-950 text-lime-400 font-extrabold shadow-2xs'
                                : 'text-foreground hover:bg-forest-900/10 hover:text-forest-950 font-medium',
                        )}
                    >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check className="h-4 w-4 shrink-0 text-lime-400 stroke-[3px]" aria-hidden="true" />}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <div ref={rootRef} className="relative">
            <span id={labelId} className="mb-2 block text-sm font-medium text-foreground">
                {label}
                {required && <span className="ml-1 text-error-600" aria-hidden="true">*</span>}
            </span>

            <button
                ref={btnRef}
                type="button"
                disabled={disabled}
                onClick={() => (open ? closeList() : openList())}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-labelledby={labelId}
                aria-activedescendant={open && activeIndex >= 0 ? optId(activeIndex) : undefined}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-field border bg-background-card px-4 py-3 text-left text-[0.9375rem]',
                    'transition-all duration-200 disabled:opacity-50',
                    open ? 'border-forest-950 ring-2 ring-lime-400/50 shadow-md'
                        : error ? 'border-error-500'
                            : 'border-border hover:border-border-hover',
                    value ? 'text-foreground font-semibold' : 'text-foreground-faint',
                )}
            >
                <span className="truncate">{value || placeholder}</span>
                <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-200', open && 'rotate-180 text-forest-950')}
                    aria-hidden="true"
                />
            </button>

            {/* Rendu via portal pour éviter overflow-hidden du parent */}
            {mounted && createPortal(dropdownContent, document.body)}

            {error && (
                <p id={errorId} role="alert" className="mt-1.5 text-xs text-error-600">
                    {error}
                </p>
            )}
        </div>
    );
}