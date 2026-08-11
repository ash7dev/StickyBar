'use client';

import { useRef, type ComponentType } from 'react';
import {
  AlertTriangle, CalendarCheck, Home, MessageSquare, Search, Wallet, Scale,
  ShieldCheck, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type StatutTicket = 'OUVERT' | 'EN_COURS' | 'EN_ATTENTE_UTILISATEUR' | 'RESOLU' | 'FERME';
export type PrioriteTicket = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE';
export type CategorieTicket = 'RESERVATION' | 'PAIEMENT' | 'KYC' | 'LOGEMENT' | 'LITIGE' | 'AUTRE';

export interface TicketMessageItem {
  id: string;
  ticketId: string;
  auteurId: string;
  estAdmin: boolean;
  message: string;
  creeLe: string;
  auteur?: { id: string; nom?: string; prenom?: string; email?: string };
}

export interface TicketSupportItem {
  id: string;
  code: string;
  utilisateurId: string;
  reservationId?: string | null;
  logementId?: string | null;
  sujet: string;
  categorie: CategorieTicket;
  priorite: PrioriteTicket;
  statut: StatutTicket;
  creeLe: string;
  misAJourLe: string;
  resoluLe?: string | null;
  utilisateur?: { id: string; nom?: string; prenom?: string; email?: string; telephone?: string };
  messages?: TicketMessageItem[];
}

interface AdminSupportTicketsListProps {
  tickets: TicketSupportItem[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: TicketSupportItem) => void;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  isLoading: boolean;
}

/* ─── Référentiels ────────────────────────────────────────────────────────
   Une seule table par énumération, partagée entre le <select> et le badge.
   Les libellés lisibles n'existaient que dans le select : la carte affichait
   `EN_ATTENTE_UTILISATEUR` brut, en majuscules, dans un badge de 10 px.

   ⚠ `sand-*` appartenait à la palette ImmoLoc, retirée en v2 parce qu'elle
   faisait virer le lime au moutarde. `error-200`, `forest-300` en bordure de
   badge : le statut EN_COURS rendait entièrement à nu. */

const STATUTS: Record<StatutTicket, { label: string; badge: string }> = {
  OUVERT: { label: 'Ouvert', badge: 'border-error-500/25 bg-error-50 text-error-700' },
  EN_COURS: { label: 'En cours', badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
  EN_ATTENTE_UTILISATEUR: { label: 'Attente client', badge: 'border-info-500/25 bg-info-50 text-info-700' },
  RESOLU: { label: 'Résolu', badge: 'border-forest-100 bg-forest-50 text-forest-700' },
  FERME: { label: 'Fermé', badge: 'border-border bg-background-alt text-foreground-muted' },
};

const CATEGORIES: Record<CategorieTicket, { label: string; Icon: ComponentType<{ className?: string }> }> = {
  RESERVATION: { label: 'Réservation', Icon: CalendarCheck },
  PAIEMENT: { label: 'Paiement', Icon: Wallet },
  KYC: { label: 'Vérification KYC', Icon: ShieldCheck },
  LOGEMENT: { label: 'Logement', Icon: Home },
  LITIGE: { label: 'Litige', Icon: Scale },
  AUTRE: { label: 'Autre', Icon: HelpCircle },
};

/* `priorite` était dans le type et n'apparaissait nulle part — c'est pourtant
   le premier critère de tri d'une file de support. Seules HAUTE et URGENTE
   s'affichent : marquer les quatre niveaux revient à n'en marquer aucun. */
const PRIORITES: Partial<Record<PrioriteTicket, { label: string; classe: string }>> = {
  URGENTE: { label: 'Urgent', classe: 'bg-error-500' },
  HAUTE: { label: 'Priorité haute', classe: 'bg-warning-500' },
};

/* ─── Utilitaires ─────────────────────────────────────────────────────────── */

const JOUR = 86_400_000;

/** « il y a 3 h », « il y a 5 j » — l'ancienneté prime sur la date exacte. */
function depuis(iso?: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const ecart = Date.now() - t;
  if (ecart < 3_600_000) return `il y a ${Math.max(1, Math.round(ecart / 60_000))} min`;
  if (ecart < JOUR) return `il y a ${Math.round(ecart / 3_600_000)} h`;
  const jours = Math.round(ecart / JOUR);
  if (jours < 31) return `il y a ${jours} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const joursDepuis = (iso?: string) => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : Math.floor((Date.now() - t) / JOUR);
};

/** Dernier message par date, sans supposer l'ordre du tableau. */
function dernierMessage(messages?: TicketMessageItem[]): TicketMessageItem | undefined {
  if (!messages?.length) return undefined;
  return messages.reduce((a, b) =>
    new Date(b.creeLe).getTime() > new Date(a.creeLe).getTime() ? b : a,
  );
}

const nomUtilisateur = (u?: { prenom?: string; nom?: string }) =>
  `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim() || 'Utilisateur';

/* ─── Composant ───────────────────────────────────────────────────────────── */

export function AdminSupportTicketsList({
  tickets,
  selectedTicketId,
  onSelectTicket,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  isLoading,
}: AdminSupportTicketsListProps) {
  const liste = useRef<HTMLDivElement>(null);

  /* Les tickets étaient des <div onClick> : ni focus, ni Entrée, ni flèches.
     Un agent qui enchaîne quarante dossiers travaille au clavier — c'était le
     composant qui en avait le plus besoin et le seul à l'interdire. */
  const naviguer = (e: React.KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const options = Array.from(
      liste.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    if (!options.length) return;
    const i = options.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    const suivant =
      e.key === 'Home' ? 0
        : e.key === 'End' ? options.length - 1
          : e.key === 'ArrowDown' ? Math.min(i + 1, options.length - 1)
            : Math.max(i - 1, 0);
    options[suivant]?.focus();
  };

  /* La hauteur fixe à 720 px débordait sur un portable 1366×768 et laissait un
     vide sur grand écran. */
  const hauteur = 'h-[clamp(26rem,calc(100vh-13rem),46rem)]';

  const champ =
    'w-full rounded-field border border-border bg-background-alt px-3 text-foreground transition-colors focus:border-forest-600 focus:outline-none';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-card border border-border bg-background-card p-4 shadow-xs',
        hauteur,
      )}
    >
      {/* ── Recherche et filtres ─────────────────────────────────────────
          Aucune utilitaire de taille sur les champs : la couche `base` force
          16 px, et un `text-xs` ici fait zoomer Safari iOS au focus. */}
      <div className="shrink-0 space-y-2 border-b border-border pb-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Rechercher un ticket par code, nom ou sujet"
            placeholder="Code, nom, sujet…"
            className={cn(champ, 'h-11 rounded-pill pl-10')}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filtre-statut" className="sr-only">Filtrer par statut</label>
            <select
              id="filtre-statut"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className={cn(champ, 'h-10')}
            >
              <option value="ALL">Tous les statuts</option>
              {/* Les émojis 🔴🟡🔵 ne sont pas stylables, rendent différemment
                  selon l'OS et sont lus à voix haute (« cercle rouge »). La
                  couleur du statut appartient au badge. */}
              {(Object.keys(STATUTS) as StatutTicket[]).map((s) => (
                <option key={s} value={s}>{STATUTS[s].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtre-categorie" className="sr-only">Filtrer par catégorie</label>
            <select
              id="filtre-categorie"
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className={cn(champ, 'h-10')}
            >
              <option value="ALL">Toutes catégories</option>
              {(Object.keys(CATEGORIES) as CategorieTicket[]).map((c) => (
                <option key={c} value={c}>{CATEGORIES[c].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── File ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex-1 space-y-2 overflow-hidden" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-inner bg-background-alt" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <MessageSquare className="h-8 w-8 text-neutral-400" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Aucun ticket</p>
          <p className="max-w-[220px] text-xs text-foreground-muted">
            Aucune demande ne correspond à la recherche ou aux filtres.
          </p>
        </div>
      ) : (
        <div
          ref={liste}
          role="listbox"
          aria-label="File des tickets"
          aria-activedescendant={selectedTicketId ? `ticket-${selectedTicketId}` : undefined}
          onKeyDown={naviguer}
          className="no-scrollbar flex-1 space-y-2 overflow-y-auto pr-1"
        >
          {tickets.map((t) => {
            const selectionne = selectedTicketId === t.id;
            const statut = STATUTS[t.statut] ?? STATUTS.FERME;
            const categorie = CATEGORIES[t.categorie] ?? CATEGORIES.AUTRE;
            const CatIcon = categorie.Icon;
            const priorite = PRIORITES[t.priorite];

            const dernier = dernierMessage(t.messages);
            /* Un ticket dont le dernier message vient du client attend une
               réponse. C'est l'information qui trie une file de support, et
               elle était calculable depuis `messages` sans être affichée. */
            const attendReponse =
              t.statut !== 'RESOLU' &&
              t.statut !== 'FERME' &&
              (dernier ? !dernier.estAdmin : t.statut === 'OUVERT');

            const anciennete = joursDepuis(t.misAJourLe || t.creeLe);
            const dort = attendReponse && anciennete >= 2;

            return (
              <div
                key={t.id}
                id={`ticket-${t.id}`}
                role="option"
                aria-selected={selectionne}
                tabIndex={selectionne ? 0 : -1}
                onClick={() => onSelectTicket(t)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTicket(t);
                  }
                }}
                className={cn(
                  'relative cursor-pointer rounded-inner border p-3 transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  selectionne
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-border bg-background-card hover:border-border-hover hover:bg-background-alt',
                )}
              >
                {/* Ligne 1 — code, priorité, statut */}
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {priorite && (
                      <span
                        aria-hidden
                        title={priorite.label}
                        className={cn('h-1.5 w-1.5 shrink-0 rounded-pill', priorite.classe)}
                      />
                    )}
                    <span className="truncate font-mono text-xs font-semibold text-forest-700">
                      {t.code}
                    </span>
                    {priorite && <span className="sr-only">{priorite.label}</span>}
                  </span>

                  <span
                    className={cn(
                      'shrink-0 rounded-pill border px-2 py-0.5 text-xs font-semibold',
                      statut.badge,
                    )}
                  >
                    {statut.label}
                  </span>
                </div>

                {/* Ligne 2 — sujet */}
                <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{t.sujet}</p>

                {/* Ligne 3 — catégorie et rattachement */}
                <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-muted">
                  <CatIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    {categorie.label}
                    {t.reservationId ? ' · réservation liée' : t.logementId ? ' · logement lié' : ''}
                  </span>
                </p>

                {/* Ligne 4 — auteur, ancienneté */}
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-1.5 text-xs">
                  <span className="truncate text-foreground-muted">
                    {nomUtilisateur(t.utilisateur)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 tabular-nums',
                      dort ? 'font-semibold text-warning-700' : 'text-foreground-muted',
                    )}
                  >
                    {depuis(t.misAJourLe || t.creeLe)}
                  </span>
                </div>

                {/* Une file de support se lit par ce qui attend une réponse. */}
                {attendReponse && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-warning-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    En attente de réponse
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}