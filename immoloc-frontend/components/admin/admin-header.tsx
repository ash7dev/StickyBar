'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftRight, Bell, ChevronDown, ExternalLink, LogOut, Megaphone, Menu, Scale,
  Search, Settings, ShieldAlert, ShieldCheck, Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils/cn';

/* Casse de phrase, comme partout ailleurs dans le système. Les intitulés
   étaient aussi redondants : la page /admin/statistiques n'a pas besoin de
   rappeler « Klef » dans son titre. */
const TITRES: Array<[string, string]> = [
  ['/admin/dashboard', 'Vue d’ensemble'],
  ['/admin/statistiques', 'Revenus et performance'],
  ['/admin/kyc', 'Vérification d’identité'],
  ['/admin/annonces', 'Modération des annonces'],
  ['/admin/litiges', 'Litiges'],
  ['/admin/support', 'Support'],
  ['/admin/avis', 'Modération des avis'],
  ['/admin/hotes', 'Hôtes'],
  ['/admin/locataires', 'Locataires'],
  ['/admin/logements', 'Logements'],
  ['/admin/utilisateurs', 'Utilisateurs'],
  ['/admin/reservations', 'Réservations'],
  ['/admin/finances', 'Finances et retraits'],
  ['/admin/notifications', 'Diffusion de notifications'],
  ['/admin/equipements', 'Référentiel des équipements'],
  ['/admin/parametres', 'Paramètres'],
  ['/admin', 'Administration'],
];

export interface UrgentBreakdown {
  kyc?: number;
  annonces?: number;
  retraits?: number;
  litiges?: number;
}

interface AdminHeaderProps {
  onMenuToggle: () => void;
  /** Total des actions urgentes. Calculé depuis `urgentDetails` s'il est fourni. */
  urgentCount?: number;
  /**
   * Répartition par file. Sans elle, le menu liste des catégories sans dire
   * laquelle est en retard : « 7 urgences » et trois liens muets.
   * Le commentaire d'origine annonçait quatre files dont les litiges, qui
   * n'avaient aucune entrée dans le menu.
   */
  urgentDetails?: UrgentBreakdown;
}

const FILES: Array<{
  cle: keyof UrgentBreakdown;
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
    { cle: 'kyc', href: '/admin/kyc', label: 'Dossiers d’identité', Icon: ShieldCheck },
    { cle: 'annonces', href: '/admin/annonces', label: 'Annonces à modérer', Icon: ShieldAlert },
    { cle: 'litiges', href: '/admin/litiges', label: 'Litiges à arbitrer', Icon: Scale },
    { cle: 'retraits', href: '/admin/finances', label: 'Retraits à valider', Icon: Wallet },
  ];

export function AdminHeader({ onMenuToggle, urgentCount, urgentDetails }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const clearSession = useRoleStore((s) => s.clearSession);
  const { data: user } = useCurrentUser();

  const [menu, setMenu] = useState<'none' | 'notif' | 'compte'>('none');
  const [recherche, setRecherche] = useState('');
  const [estMac, setEstMac] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const compteRef = useRef<HTMLDivElement>(null);
  const champRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setEstMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (menu === 'none') return;
    const auPointeur = (e: PointerEvent) => {
      const ref = menu === 'notif' ? notifRef : compteRef;
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu('none');
    };
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu('none');
    };
    document.addEventListener('pointerdown', auPointeur);
    document.addEventListener('keydown', auClavier);
    return () => {
      document.removeEventListener('pointerdown', auPointeur);
      document.removeEventListener('keydown', auClavier);
    };
  }, [menu]);

  useEffect(() => setMenu('none'), [pathname]);

  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        champRef.current?.focus();
      }
    };
    document.addEventListener('keydown', auClavier);
    return () => document.removeEventListener('keydown', auClavier);
  }, []);

  const rechercher = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = recherche.trim();
      if (!q) return;
      router.push(`/admin/utilisateurs?search=${encodeURIComponent(q)}`);
      champRef.current?.blur();
    },
    [recherche, router],
  );

  const deconnexion = useCallback(async () => {
    setMenu('none');
    try {
      await supabase.auth.signOut();
    } finally {
      clearSession();
      window.location.href = '/';
    }
  }, [supabase, clearSession]);

  const titre =
    TITRES.find(([cle]) => pathname === cle || pathname.startsWith(`${cle}/`))?.[1] ??
    'Administration';

  const prenom = user?.prenom?.trim();
  const nom = user?.nom?.trim();
  const initiales =
    `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() ||
    (user?.email?.[0] ?? 'A').toUpperCase();

  const files = FILES.map((f) => ({ ...f, nombre: urgentDetails?.[f.cle] ?? 0 }));
  const total =
    urgentDetails
      ? files.reduce((a, f) => a + f.nombre, 0)
      : (urgentCount ?? 0);

  const entreeMenu =
    'flex items-center gap-3 rounded-pill px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt';

  return (
    /* `backdrop-blur-md` derrière un fond à 95 % d'opacité : le filtre ne
       produit rien de visible et coûte du GPU à chaque scroll. */
    <header className="sticky top-0 z-40 border-b border-border bg-background-card text-foreground">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* ── Gauche ─────────────────────────────────────────────────── */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Ouvrir le menu d’administration"
              className="rounded-pill border border-border bg-background-alt p-2 text-foreground transition-colors hover:bg-background-card lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>

            <div className="min-w-0">
              {/* `purple-50 / 200 / 800` n'existent pas : ce badge rendait sans
                  fond, sans bordure et sans couleur de texte. */}
              <span className="hidden items-center gap-1 rounded-pill border border-border bg-background-alt px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted sm:inline-flex">
                <ShieldAlert className="h-3 w-3" aria-hidden />
                Administration
              </span>
              <h1 className="truncate font-display text-base font-semibold leading-tight text-foreground sm:text-xl">
                {titre}
              </h1>
            </div>
          </div>

          {/* ── Recherche ──────────────────────────────────────────────── */}
          <div className="mx-4 hidden max-w-md flex-1 items-center md:flex">
            <form onSubmit={rechercher} role="search" className="relative w-full">
              <label htmlFor="admin-search" className="sr-only">
                Rechercher un utilisateur
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
                aria-hidden
              />
              {/* Le placeholder annonçait « un logement, un code » alors que la
                  soumission part toujours sur /admin/utilisateurs. */}
              <input
                id="admin-search"
                ref={champRef}
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un utilisateur…"
                /* `text-foreground-faint` (neutral-400, 2,22:1) sur un
                   placeholder : c'est du texte, pas un séparateur. */
                className="h-10 w-full rounded-pill border border-border bg-background-alt pl-10 pr-16 text-foreground placeholder:text-neutral-500 transition-colors focus:border-forest-600 focus:outline-none"
              />
              <kbd
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-pill border border-border bg-background-card px-2 py-0.5 text-xs font-semibold text-foreground-muted"
              >
                {estMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </form>
          </div>

          {/* ── Droite ─────────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              href="/admin/notifications"
              className="hidden h-9 items-center gap-2 rounded-pill border border-border bg-background-alt px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-card sm:inline-flex"
            >
              <Megaphone className="h-3.5 w-3.5 text-forest-600" aria-hidden />
              Diffusion
            </Link>

            {/* ── Alertes ───────────────────────────────────────────────── */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setMenu((m) => (m === 'notif' ? 'none' : 'notif'))}
                aria-expanded={menu === 'notif'}
                aria-haspopup="menu"
                aria-label={
                  total > 0
                    ? `Actions urgentes : ${total} en attente`
                    : 'Actions urgentes : aucune'
                }
                className="relative flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-background-alt text-foreground transition-colors hover:bg-background-card"
              >
                <Bell className="h-4 w-4" aria-hidden />
                {total > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-pill bg-error-600 px-1 text-xs font-semibold tabular-nums text-neutral-0"
                  >
                    {total > 9 ? '9+' : total}
                  </span>
                )}
              </button>

              {menu === 'notif' && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2.5 w-80 overflow-hidden rounded-card border border-border bg-background-card shadow-xl"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border bg-background-alt px-4 py-3">
                    <p className="eyebrow text-[0.6875rem]">Actions en attente</p>
                    {total > 0 && (
                      <span className="rounded-pill border border-error-500/25 bg-error-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-error-700">
                        {total}
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-border">
                    {files.map(({ cle, href, label, Icon, nombre }) => (
                      <Link
                        key={cle}
                        href={href}
                        role="menuitem"
                        /* Les entrées ne fermaient pas le menu : sur un lien
                           vers la page courante, il restait ouvert. */
                        onClick={() => setMenu('none')}
                        className="flex items-center justify-between gap-3 p-3.5 text-xs transition-colors hover:bg-background-alt"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
                          <span className="truncate font-medium text-foreground">{label}</span>
                        </span>

                        {urgentDetails ? (
                          <span
                            className={cn(
                              'shrink-0 rounded-pill px-2 py-0.5 text-xs font-semibold tabular-nums',
                              nombre > 0
                                ? 'bg-error-50 text-error-700'
                                : 'bg-background-alt text-foreground-muted',
                            )}
                          >
                            {nombre}
                          </span>
                        ) : (
                          <span className="shrink-0 font-semibold text-link">Ouvrir</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Compte ────────────────────────────────────────────────── */}
            <div ref={compteRef} className="relative">
              <button
                type="button"
                onClick={() => setMenu((m) => (m === 'compte' ? 'none' : 'compte'))}
                aria-expanded={menu === 'compte'}
                aria-haspopup="menu"
                aria-label="Menu du compte administrateur"
                className="flex h-9 items-center gap-2 rounded-pill border border-border bg-background-alt pl-1.5 pr-2.5 transition-colors hover:bg-background-card"
              >
                {/* `h-6.5 w-6.5` n'est pas une classe Tailwind : la pastille
                    n'avait aucune dimension. */}
                <span className="flex h-7 w-7 items-center justify-center rounded-inner bg-forest-800 font-display text-xs font-semibold text-neutral-0">
                  {initiales}
                </span>
                <span className="hidden max-w-[100px] truncate text-xs font-semibold text-foreground md:inline">
                  {prenom || 'Admin'}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-foreground-muted transition-transform',
                    menu === 'compte' && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>

              {menu === 'compte' && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2.5 w-64 overflow-hidden rounded-card border border-border bg-background-card shadow-xl"
                >
                  <div className="border-b border-border bg-background-alt px-4 py-3">
                    <p className="eyebrow text-[0.6875rem]">Connecté en tant que</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
                      {user?.email ?? '—'}
                    </p>
                  </div>

                  <div className="space-y-0.5 p-2">
                    <Link href="/dashboard" role="menuitem" onClick={() => setMenu('none')} className={entreeMenu}>
                      <ArrowLeftRight className="h-4 w-4 text-foreground-muted" aria-hidden />
                      Tableau de bord hôte
                    </Link>

                    <Link href="/" role="menuitem" onClick={() => setMenu('none')} className={entreeMenu}>
                      <ExternalLink className="h-4 w-4 text-foreground-muted" aria-hidden />
                      Site public
                    </Link>

                    <Link href="/admin/parametres" role="menuitem" onClick={() => setMenu('none')} className={entreeMenu}>
                      <Settings className="h-4 w-4 text-foreground-muted" aria-hidden />
                      Paramètres
                    </Link>

                    <div aria-hidden className="my-1 h-px bg-border" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={deconnexion}
                      className={cn(entreeMenu, 'w-full text-error-700 hover:bg-error-50')}
                    >
                      <LogOut className="h-4 w-4" aria-hidden />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}