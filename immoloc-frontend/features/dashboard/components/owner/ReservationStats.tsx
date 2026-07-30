'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Info, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Booking { statut: string }

interface Props {
  bookings?: Booking[] | null;
  /** Le parent charge encore : sans ce drapeau, on affiche « aucune donnée »
   *  à quelqu'un qui en a, simplement parce que la requête n'a pas répondu. */
  isLoading?: boolean;
}

/* Toutes les couleurs viennent des tokens.
   L'original mélangeait #14654C et #D3F26E en dur avec des var(), et donnait
   la MÊME couleur à CONFIRMED et PAID : deux entrées indistinguables dans une
   légende dont c'est précisément la fonction. */
const STATUT_CONFIG: Record<string, { label: string; color: string; counts: 'honored' | 'failed' | 'pending' }> = {
  COMPLETED: { label: 'Terminées', color: 'var(--forest-600)', counts: 'honored' },
  CHECKED_IN: { label: 'En cours', color: 'var(--lime-500)', counts: 'honored' },
  CONFIRMED: { label: 'Confirmées', color: 'var(--forest-400)', counts: 'pending' },
  PAID: { label: 'Payées', color: 'var(--forest-300)', counts: 'pending' },
  PENDING: { label: 'En attente', color: 'var(--warning-500)', counts: 'pending' },
  CANCELLED: { label: 'Annulées', color: 'var(--neutral-400)', counts: 'failed' },
  DISPUTED: { label: 'Litiges', color: 'var(--error-500)', counts: 'failed' },
};

/** En dessous, un pourcentage n'a pas de sens : une annulation sur trois
 *  réservations donnerait « 67 % » et affolerait pour rien. */
const MIN_FOR_RATE = 5;

function Gauge({ value, label }: { value: number; label: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    // Respect de prefers-reduced-motion : l'animation d'origine n'en tenait
    // pas compte et durait 1 000 ms.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return;
    }
    const t = setTimeout(() => setShown(value), 120);
    return () => clearTimeout(t);
  }, [value]);

  const size = 190;
  const stroke = size * 0.11;
  const r = (size - stroke) / 2;
  const c = Math.PI * r;
  const center = size / 2;
  const arc = `M ${stroke / 2} ${center} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${center}`;

  const tone = value >= 85 ? 'var(--success-500)' : value >= 60 ? 'var(--warning-500)' : 'var(--error-500)';

  return (
    <div className="relative mx-auto w-full max-w-[190px]">
      {/* L'ancienne jauge etait un SVG muet : aucun lecteur d'ecran ne
          pouvait en restituer la valeur. */}
      <svg
        viewBox={`0 0 ${size} ${size * 0.58}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`${label} : ${value} %`}
      >
        <path d={arc} fill="none" stroke="var(--neutral-200)" strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={arc}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (shown / 100) * c}
          // transition-all sur un tracé SVG animait tout ; seul le décalage
          // change. Et 1 000 ms n'existe pas dans l'échelle du système.
          style={{ transition: 'stroke-dashoffset 320ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="font-display text-3xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-forest-900">
          {value}%
        </span>
        <span className="mt-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">
          {label}
        </span>
      </div>
    </div>
  );
}

function Row({ color, label, count, pct }: { color: string; label: string; count: number; pct?: number }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-pill" style={{ backgroundColor: color }} aria-hidden="true" />
        <span className="truncate text-sm text-foreground">{label}</span>
      </span>
      <span className="flex shrink-0 items-baseline gap-1.5">
        <span className="text-sm font-semibold tabular-nums text-forest-900">{count}</span>
        {pct != null && <span className="text-xs tabular-nums text-foreground-faint">{pct}%</span>}
      </span>
    </li>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm lg:p-6">
      <header className="border-b border-border pb-3">
        <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-forest-900">
          Vos réservations
        </h2>
        <p className="mt-0.5 text-xs text-foreground-muted">Répartition par statut</p>
      </header>
      {children}
    </section>
  );
}

export function ReservationStats({ bookings, isLoading = false }: Props) {
  /* ── Cas 1 : chargement ─────────────────────────────────────────────── */
  // Absent de l'original : pendant le fetch, bookings vaut [] et l'utilisateur
  // lisait « Aucune statistique » alors qu'il en avait.
  if (isLoading) {
    return (
      <Shell>
        <div className="animate-pulse space-y-4" aria-hidden="true">
          <div className="mx-auto h-24 w-[190px] rounded-t-full bg-neutral-100" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-9 rounded-inner bg-neutral-100" />)}
          </div>
        </div>
        <span className="sr-only" role="status">Chargement des statistiques</span>
      </Shell>
    );
  }

  /* ── Cas 2 : donnée absente ─────────────────────────────────────────── */
  // bookings.filter plantait si la prop était undefined ou null.
  const list = bookings ?? [];
  const filtered = list.filter((b) => b.statut !== 'EXPIRED');

  const groups = filtered.reduce<Record<string, number>>((acc, b) => {
    acc[b.statut] = (acc[b.statut] ?? 0) + 1;
    return acc;
  }, {});

  const known = Object.entries(groups).filter(([s]) => STATUT_CONFIG[s]);
  const total = known.reduce((s, [, n]) => s + n, 0);

  /* ── Cas 3 : aucune réservation ─────────────────────────────────────── */
  if (total === 0) {
    // Le cas « des réservations existent mais aucun statut connu » tombait
    // entre les mailles : la jauge affichait 0 % et la légende était vide.
    const unknown = filtered.length > 0;
    return (
      <Shell>
        <div className="flex flex-col items-center gap-2.5 py-10 text-center">
          {/* Le squircle était en forest-950 à icône lime : le bloc le plus
              sombre d'une carte claire, pour un état vide. */}
          <span className="grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-foreground-muted">
            <PieChart className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-forest-900">
            {unknown ? 'Statuts non reconnus' : 'Pas encore de réservation'}
          </p>
          <p className="max-w-[16rem] text-xs leading-relaxed text-foreground-muted">
            {unknown
              ? 'Vos réservations existent mais leur statut n’est pas encore pris en charge ici.'
              : 'Les statistiques apparaîtront dès votre première réservation.'}
          </p>
          {!unknown && (
            <Link
              href="/dashboard/annonces"
              className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-border px-4 py-2 text-xs font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
            >
              Améliorer mes annonces
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </Shell>
    );
  }

  const entries = known
    .map(([statut, count]) => ({
      statut,
      count,
      pct: Math.round((count / total) * 100),
      ...STATUT_CONFIG[statut],
    }))
    .sort((a, b) => b.count - a.count);

  /*
    Le vrai taux, et son nom correct.

    L'ancienne jauge montrait le pourcentage du statut DOMINANT sous le
    libellé « Performance globale ». Un hôte dont 60 % des réservations
    étaient annulées lisait « 60 % de performance », en vert.

    Ici : séjours honorés rapportés aux séjours qui ont abouti d'une façon
    ou d'une autre. Les réservations encore en cours ne comptent dans aucun
    des deux termes — elles ne sont pas encore un succès ni un échec.
  */
  const honored = entries.filter((e) => e.counts === 'honored').reduce((s, e) => s + e.count, 0);
  const failed = entries.filter((e) => e.counts === 'failed').reduce((s, e) => s + e.count, 0);
  const settled = honored + failed;
  const rate = settled > 0 ? Math.round((honored / settled) * 100) : null;

  /* ── Cas 4 : trop peu de données pour un pourcentage ────────────────── */
  const enoughForRate = settled >= MIN_FOR_RATE && rate !== null;

  return (
    <Shell>
      {enoughForRate ? (
        <div className="py-2">
          <Gauge value={rate} label="Séjours honorés" />
        </div>
      ) : (
        <p className="flex items-start gap-2.5 rounded-inner bg-background-alt p-3.5 text-xs leading-relaxed text-foreground-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground-faint" aria-hidden="true" />
          {settled === 0
            ? 'Aucun séjour terminé pour l’instant : le taux d’honoration s’affichera ensuite.'
            : `Encore ${MIN_FOR_RATE - settled} séjour${MIN_FOR_RATE - settled > 1 ? 's' : ''} avant qu’un taux soit significatif.`}
        </p>
      )}

      {/* entries.slice(0, 3) masquait silencieusement les statuts suivants :
          un hôte avec des litiges pouvait ne jamais les voir. Tout est listé. */}
      <ul aria-label="Répartition par statut">
        {entries.map((e) => (
          <Row
            key={e.statut}
            color={e.color}
            label={e.label}
            count={e.count}
            pct={total >= MIN_FOR_RATE ? e.pct : undefined}
          />
        ))}
      </ul>

      <Link
        href="/dashboard/reservations"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-pill border border-border bg-background-card py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
      >
        {/* Le lien annonçait « statistiques détaillées » mais menait à la
            liste des réservations. */}
        Voir toutes mes réservations
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </Shell>
  );
}