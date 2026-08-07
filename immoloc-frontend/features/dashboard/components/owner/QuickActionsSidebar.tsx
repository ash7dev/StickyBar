'use client';

import Link from 'next/link';
import {
  CalendarRange, ChevronRight, MessageCircle, PlusCircle, Tag, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   Ce panneau LANCE des actions ; il n'affiche pas d'etat.

   Trois des quatre entrees d'origine doublonnaient avec d'autres cartes du
   tableau de bord :
     - « Confirmer réservations » -> PendingActions le fait, avec le compte
     - « Retirer des fonds »      -> WalletSnapshot le fait, avec le montant
     - « Déclarer un litige »     -> PendingActions le fait, et surtout un
       litige a besoin d'une reservation : dates, photos, historique. Un
       formulaire vierge ouvert depuis un raccourci n'a aucun de ces
       elements, et /dashboard/litiges/nouveau n'existe nulle part ailleurs
       dans le produit.

   Restent les actions reellement initiatrices, dont deux qui manquaient et
   qu'un hote fait souvent : bloquer des dates et ajuster ses tarifs.
   ═══════════════════════════════════════════════════════════════════════════ */

interface Action {
  icon: React.ElementType;
  label: string;
  sub: string;
  href: string;
  external?: boolean;
  primary?: boolean;
}

interface Props {
  /** Sans annonce, publier devient l'action principale. */
  activeListings?: number;
  /** Numéro WhatsApp du support, au format wa.me (sans +). */
  supportWhatsapp?: string;
}

export function QuickActionsSidebar({ activeListings = 0, supportWhatsapp }: Props) {
  const noListing = activeListings === 0;

  const actions: Action[] = [
    {
      icon: PlusCircle,
      label: 'Publier un bien',
      sub: 'Gratuit, vérifié avant mise en ligne',
      href: '/dashboard/annonces/nouvelle',
      primary: noListing,
    },
    {
      icon: CalendarRange,
      label: 'Bloquer des dates',
      sub: 'Indisponibilités et travaux',
      href: '/dashboard/annonces',
    },
    {
      icon: Tag,
      label: 'Ajuster mes tarifs',
      sub: 'Prix de base et réductions',
      href: '/dashboard/annonces',
    },
    {
      icon: MessageCircle,
      label: 'Contacter le support',
      sub: 'Réponse rapide sur WhatsApp',
      href: supportWhatsapp ? `https://wa.me/${supportWhatsapp}` : '/contact',
      external: Boolean(supportWhatsapp),
    },
  ];

  return (
    <section className="klef-rise space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm lg:p-6">
      <header className="flex items-center gap-3 border-b border-border pb-3">
        {/* Cinq squircles forest-950 a icone lime dans un panneau lateral :
            l'en-tete plus les quatre actions. Neutres sur fond clair. */}
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-neutral-100 text-forest-700">
          <Zap className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">Raccourcis</p>
          <h2 className="truncate font-display text-base font-semibold tracking-[-0.015em] text-forest-900">
            Actions rapides
          </h2>
        </div>
      </header>

      {/* Les entrees etaient des <div> avec des <h4> choisis pour leur taille.
          Un niveau de titre n'est pas un style, et une suite de liens est une
          liste. */}
      <ul className="space-y-2">
        {actions.map(({ icon: Icon, label, sub, href, external, primary }) => {
          const inner = (
            <>
              <span className="flex min-w-0 items-center gap-3">
                <span className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-inner',
                  primary ? 'bg-marker-bg text-forest-800' : 'bg-neutral-100 text-forest-700',
                )}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-forest-900">{label}</span>
                  <span className="block truncate text-xs text-foreground-muted">{sub}</span>
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-foreground-faint transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </>
          );

          const cls = cn(
            'group flex items-center justify-between gap-3 rounded-inner border p-3.5',
            'transition-colors duration-150',
            primary
              // Une seule action est mise en avant, et seulement quand elle
              // est la bonne : publier, quand il n'y a encore aucun bien.
              ? 'border-action/40 bg-lime-50 hover:bg-lime-100'
              : 'border-border bg-background-alt hover:bg-background-card',
          );

          return (
            <li key={label}>
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                </a>
              ) : (
                <Link href={href} className={cls}>{inner}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}