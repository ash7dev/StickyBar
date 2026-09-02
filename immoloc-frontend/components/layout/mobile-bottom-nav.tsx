'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftRight, CalendarDays, Compass, Home, List, Loader2, Map, Settings,
} from 'lucide-react';
import { useRoleStore, useIsAuthenticated } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { cn } from '@/lib/utils/cn';

/* ---------------------------------------------------------------------------
   Barre de navigation locataire.
--------------------------------------------------------------------------- */

const NAV = [
  { href: '/', label: 'Accueil', icon: Home, exact: true },
  { href: '/explorer', label: 'Explorer', icon: Compass, exact: false },
  { href: '/reservations', label: 'Réservations', icon: CalendarDays, exact: false },
  { href: '/parametres', label: 'Réglages', icon: Settings, exact: false },
] as const;

const VISIBLE_ON = new Set<string>(['/', '/explorer', '/reservations', '/parametres']);

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { activeRole, estProprietaire } = useRoleStore();
  const { switchRole, isSwitching } = useSwitchRole();
  const [switchError, setSwitchError] = useState(false);
  const [explorerView, setExplorerView] = useState<'list' | 'map'>('list');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleViewChanged = (e: Event) => {
      const customEvent = e as CustomEvent<'list' | 'map'>;
      if (customEvent.detail) {
        setExplorerView(customEvent.detail);
      }
    };

    window.addEventListener('explorer-view-changed', handleViewChanged);
    return () => {
      window.removeEventListener('explorer-view-changed', handleViewChanged);
    };
  }, []);

  /*
    Le composant ne s'affiche que sur les 4 onglets principaux et masqué
    sur le dashboard (/dashboard*).
  */
  const hidden = pathname.startsWith('/dashboard') || !VISIBLE_ON.has(pathname);
  if (!mounted || hidden) return null;

  const isOwner = activeRole === 'PROPRIETAIRE';

  async function handleSwitch() {
    setSwitchError(false);

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent('/become-host')}`);
      return;
    }
    if (isOwner) {
      try { await switchRole('LOCATAIRE', { redirectTo: '/' }); }
      catch { setSwitchError(true); }
      return;
    }
    if (estProprietaire) {
      try { await switchRole('PROPRIETAIRE', { redirectTo: '/dashboard' }); }
      catch { setSwitchError(true); }
      return;
    }
    router.push('/become-host');
  }

  return createPortal(
    <div
      className="fixed inset-x-0 z-[9999] mx-auto flex w-[calc(100%-1.5rem)] max-w-md flex-col gap-2 md:hidden"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
        {switchError && (
          <p role="alert" className="self-end rounded-pill bg-error-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg">
            Basculement impossible. Réessayez.
          </p>
        )}

        {/* ── Action bar supérieure (Même ligne : Carte/Liste à gauche + Mode Hôte à droite) ── */}
        <div className="flex w-full items-center justify-between gap-2">
          {pathname === '/explorer' ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('explorer-toggle-view'))}
              aria-label={explorerView === 'list' ? 'Afficher la carte' : 'Afficher la liste'}
              className="inline-flex h-11 items-center gap-2 rounded-pill px-4 text-sm font-semibold bg-forest-950 text-white shadow-[0_6px_20px_rgba(4,25,18,0.25)] border border-white/15 active:scale-95 transition-all duration-150"
            >
              {explorerView === 'list' ? (
                <>
                  <Map className="h-4 w-4 text-on-inverse-marker shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">Carte</span>
                </>
              ) : (
                <>
                  <List className="h-4 w-4 text-on-inverse-marker shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">Liste</span>
                </>
              )}
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={handleSwitch}
            disabled={isSwitching}
            aria-label={isOwner ? 'Passer en mode locataire' : (estProprietaire ? 'Passer en mode hôte' : 'Devenir hôte')}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-pill px-4 text-sm font-semibold transition-all duration-150 disabled:opacity-60 shrink-0',
              isOwner
                ? 'bg-forest-900 text-on-inverse-marker border border-forest-700 shadow-lg hover:bg-forest-950'
                : 'bg-action text-on-action shadow-action hover:bg-action-hover'
            )}
          >
            {isSwitching ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowLeftRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="whitespace-nowrap">
              {isOwner
                ? 'Passer en mode locataire'
                : estProprietaire
                ? 'Passer en mode hôte'
                : 'Devenir hôte'}
            </span>
          </button>
        </div>

        <nav
          aria-label="Navigation principale"
          className={cn(
            'w-full rounded-card border border-white/60 bg-white/85 p-1.5',
            // backdrop-blur-2xl vaut 40px de flou sur un element fixe present
            // pendant tout le defilement : deux fois le cout necessaire.
            'shadow-[0_8px_32px_rgba(4,25,18,0.14)] backdrop-blur-lg',
            'dark:border-white/10 dark:bg-forest-950/85',
          )}
        >
          {/* grid-cols-4 : les onglets etaient en flex-1 avec l'actif qui
              gagnait de la place. La barre se reorganisait a chaque
              navigation, sous le doigt. */}
          <ul className="grid grid-cols-4">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      // py-1.5 px-2.5 donnait environ 36px de haut, sous les
                      // 44pt d'iOS comme les 48dp d'Android.
                      'flex min-h-12 flex-col items-center justify-center gap-1 rounded-inner px-1 py-1.5',
                      'transition-colors duration-150',
                      active
                        ? 'text-forest-800 dark:text-on-inverse-marker'
                        : 'text-foreground-muted hover:text-forest-700 dark:text-forest-200',
                    )}
                  >
                    {/* Indicateur façon Material 3 : la pastille entoure
                        l'icone seule, pas l'icone ET le libelle. C'est ce qui
                        permet aux largeurs de rester constantes. */}
                    <span
                      className={cn(
                        'grid h-6 w-11 place-items-center rounded-pill transition-colors duration-150',
                        active && 'bg-marker-bg dark:bg-action/15',
                      )}
                    >
                      {/* h-4.5 w-4.5 n'existe pas dans l'echelle Tailwind
                          (seuls 0.5, 1.5, 2.5 et 3.5 sont definis) : les
                          icones n'avaient aucune taille appliquee.
                          La graisse du trait remplace le scale-110 : elle
                          n'entraine aucun recalcul de mise en page. */}
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.9} aria-hidden="true" />
                    </span>

                    {/* text-[10px] etait sous le seuil de lisibilite. */}
                    <span className="text-[0.6875rem] font-medium leading-none">
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>,
      document.body
    );
  }