'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import {
  X, User, Wallet, ShieldAlert, RotateCcw, Building2, Loader2,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { adminApi } from '@/lib/nestjs';
import type { UserItem } from './AdminUsersTable';

interface Logement {
  id: string; titre: string; type?: string; ville?: string;
  prixBase?: number; statut: string; creeLe?: string;
}
interface Faute {
  id: string; type: string; description?: string; creeLe?: string; traitee?: boolean;
}
interface UserDetails extends UserItem {
  profile?: { adresse?: string; ville?: string; nationalite?: string };
  wallet?: { solde?: number; soldeBloque?: number };
  logements?: Logement[];
  compteursFautes?: Faute[];
}

interface Props {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onBlockToggle: (user: UserItem) => void;
  onResetFaults: (user: UserItem) => void;
}

const KYC_LABELS: Record<string, { label: string; tone: string }> = {
  VERIFIE: { label: 'Vérifié', tone: 'text-gold-700' },
  EN_ATTENTE: { label: 'En attente', tone: 'text-warning-700' },
  REJETE: { label: 'Rejeté', tone: 'text-error-700' },
  NON_VERIFIE: { label: 'Non vérifié', tone: 'text-foreground-muted' },
  A_RENOUVELER: { label: 'À renouveler', tone: 'text-warning-700' },
  SUSPENDU: { label: 'Suspendu', tone: 'text-error-700' },
};

const STATUT_LOGEMENT: Record<string, string> = {
  PUBLISHED: 'Publiée', PENDING_REVIEW: 'En révision', DRAFT: 'Brouillon',
  PAUSED: 'En pause', REJECTED: 'Rejetée',
};

/* `style: 'currency'` avec XOF produit « 45 000 F CFA » avec une espace
   insécable variable selon le navigateur. Format cohérent avec le reste
   de l'app. */
const fcfa = (n?: number | null) =>
  n == null ? '—' : `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} FCFA`;

const formatDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
};

export function AdminUserDetailModal({
  user, isOpen, onClose, onBlockToggle, onResetFaults,
}: Props) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!user?.id || !isOpen) { setDetails(null); setError(false); return; }
    setIsLoading(true);
    setError(false);
    adminApi.getUserById(user.id)
      .then((data) => { if (mounted.current) setDetails(data as UserDetails); })
      .catch(() => { if (mounted.current) setError(true); })
      .finally(() => { if (mounted.current) setIsLoading(false); });
  }, [user?.id, isOpen]);

  /* Aucun Échap, aucun piège à focus, aucun verrou de scroll, et le clic sur
     le fond ne fermait pas. */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleBlock = useCallback(() => {
    if (!user) return;
    onClose();
    onBlockToggle(user);
  }, [user, onClose, onBlockToggle]);

  if (!isOpen || !user) return null;

  /* Les données complémentaires ne viennent QUE de l'API. Le repli sur
     `user` faisait afficher « aucune faute » et « portefeuille non
     initialisé » en cas d'échec réseau, comme si c'était la réalité. */
  const profile = details?.profile;
  const wallet = details?.wallet;
  const logements = details?.logements ?? [];
  const fautes = details?.compteursFautes ?? [];
  const nomComplet = [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur';
  const kyc = KYC_LABELS[user.statutKyc] ?? KYC_LABELS.NON_VERIFIE;
  const totalFautes =
    (user.nbAnnulations ?? 0) + (user.nbAbsencesJourJ ?? 0) + (user.nbNonConformites ?? 0);
  const soldeBloque = Number(wallet?.soldeBloque) || 0;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-forest-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar relative max-h-[90vh] w-full max-w-4xl space-y-6 overflow-y-auto rounded-card border border-border bg-background-card p-6 shadow-xl"
      >
        {/* ── En-tête ──────────────────────────────────────────────────── */}

        <header className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-pill border border-border bg-forest-100 text-lg font-semibold text-forest-800">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" fill sizes="48px" unoptimized className="object-cover" />
              ) : (
                `${user.prenom?.charAt(0) ?? ''}${user.nom?.charAt(0) ?? ''}`.toUpperCase() || '?'
              )}
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate font-display text-lg font-semibold text-foreground">
                {nomComplet}
              </h2>
              <p className="text-xs text-foreground-muted">
                {user.estProprietaire ? 'Hôte' : 'Locataire'} · inscrit le {formatDate(user.creeLe)}
              </p>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded-pill border border-border p-1.5 text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {isLoading ? (
          <div className="space-y-4" aria-busy="true">
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-inner bg-background-alt" />
              ))}
            </div>
            <div className="h-32 animate-pulse rounded-inner bg-background-alt" />
          </div>
        ) : (
          <>
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-error-700">
                  Le dossier complet n’a pas pu être chargé. Le portefeuille, les logements et
                  l’historique des fautes ne sont pas affichés — ils ne sont pas vides pour
                  autant. Fermez et rouvrez la fiche.
                </p>
              </div>
            )}

            {/* ── Synthèse ─────────────────────────────────────────────── */}

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1 rounded-inner border border-border bg-background-alt p-4">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  <User className="h-3.5 w-3.5" aria-hidden="true" /> Compte
                </dt>
                <dd className={cn('text-sm font-semibold', user.actif ? 'text-forest-700' : 'text-error-700')}>
                  {user.actif ? 'Actif' : 'Bloqué'}
                </dd>
                {!user.actif && user.bloqueJusqua && (
                  <p className="text-xs font-semibold text-error-700">
                    Jusqu’au {formatDate(user.bloqueJusqua)}
                  </p>
                )}
              </div>

              <div className="space-y-1 rounded-inner border border-border bg-background-alt p-4">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> KYC
                </dt>
                {/* Le statut brut s'affichait tel quel : `A_RENOUVELER`. */}
                <dd className={cn('text-sm font-semibold', kyc.tone)}>{kyc.label}</dd>
                <p className="text-xs text-foreground-muted">
                  {user.statutKyc === 'VERIFIE'
                    ? 'Pièce d’identité validée'
                    : 'Vérification à compléter'}
                </p>
              </div>

              <div className="space-y-1 rounded-inner border border-border bg-background-alt p-4">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  <Wallet className="h-3.5 w-3.5" aria-hidden="true" /> Portefeuille
                </dt>
                <dd className="font-display text-sm font-semibold tabular-nums text-foreground">
                  {error ? 'Indisponible' : wallet ? fcfa(wallet.solde) : 'Non initialisé'}
                </dd>
                {/* `wallet?.soldeBloque > 0` : comparaison sur un
                   `number | undefined`, TypeScript strict le refuse. */}
                {soldeBloque > 0 && (
                  <p className="text-xs font-semibold tabular-nums text-warning-700">
                    Dont {fcfa(soldeBloque)} bloqués
                  </p>
                )}
              </div>
            </dl>

            {/* ── Coordonnées ──────────────────────────────────────────── */}

            <section className="space-y-3 rounded-inner border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Coordonnées
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { label: 'E-mail', value: user.email ?? '—' },
                  { label: 'Téléphone', value: user.telephone ?? 'Non renseigné' },
                  profile?.adresse && {
                    label: 'Adresse',
                    value: [profile.adresse, profile.ville].filter(Boolean).join(', '),
                  },
                  profile?.nationalite && { label: 'Nationalité', value: profile.nationalite },
                ].filter(Boolean).map((f) => {
                  const field = f as { label: string; value: string };
                  return (
                    <div key={field.label}>
                      <dt className="text-xs text-foreground-muted">{field.label}</dt>
                      <dd className="text-sm font-semibold text-foreground">{field.value}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>

            {/* ── Logements ────────────────────────────────────────────── */}

            {user.estProprietaire && !error && (
              <section className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <Building2 className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                  Logements <span className="tabular-nums">{logements.length}</span>
                </h3>

                {logements.length === 0 ? (
                  <p className="rounded-inner border border-border bg-background-alt p-3 text-xs text-foreground-muted">
                    Aucun logement publié.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-inner border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-background-alt text-xs font-semibold uppercase text-foreground-muted">
                        <tr>
                          <th scope="col" className="px-3 py-2.5">Titre</th>
                          <th scope="col" className="px-3 py-2.5">Ville</th>
                          <th scope="col" className="px-3 py-2.5">Prix / nuit</th>
                          <th scope="col" className="px-3 py-2.5">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {logements.map((l) => (
                          <tr key={l.id}>
                            <td className="px-3 py-2.5 font-semibold text-foreground">{l.titre}</td>
                            <td className="px-3 py-2.5 text-foreground-muted">{l.ville ?? '—'}</td>
                            <td className="px-3 py-2.5 tabular-nums text-foreground">
                              {fcfa(l.prixBase)}
                            </td>
                            <td className="px-3 py-2.5 text-foreground-muted">
                              {STATUT_LOGEMENT[l.statut] ?? l.statut}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* ── Fautes ───────────────────────────────────────────────── */}

            <section className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <ShieldAlert className="h-4 w-4 text-warning-600" aria-hidden="true" />
                  Fautes <span className="tabular-nums">{totalFautes}</span>
                </h3>
                {totalFautes > 0 && (
                  <button
                    type="button"
                    onClick={() => onResetFaults(user)}
                    className="inline-flex h-7 items-center gap-1 rounded-pill border border-warning-500/25 bg-warning-50 px-2.5 text-xs font-semibold text-warning-700 transition-colors hover:bg-warning-50/70"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* Le compteur d'en-tête utilisait `fautes.length` (l'historique
                 détaillé), le bouton `totalFautes` (les compteurs) : deux
                 chiffres différents pour la même notion sur la même ligne. */}
              {totalFautes > 0 && (
                <p className="text-xs text-foreground-muted">
                  {[
                    (user.nbAnnulations ?? 0) > 0 && `${user.nbAnnulations} annulation${user.nbAnnulations! > 1 ? 's' : ''}`,
                    (user.nbAbsencesJourJ ?? 0) > 0 && `${user.nbAbsencesJourJ} absence${user.nbAbsencesJourJ! > 1 ? 's' : ''}`,
                    (user.nbNonConformites ?? 0) > 0 && `${user.nbNonConformites} non-conformité${user.nbNonConformites! > 1 ? 's' : ''}`,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}

              {error ? (
                <p className="rounded-inner border border-border bg-background-alt p-3 text-xs text-foreground-muted">
                  Historique indisponible.
                </p>
              ) : fautes.length === 0 ? (
                <p className="rounded-inner border border-border bg-background-alt p-3 text-xs text-foreground-muted">
                  Aucun incident enregistré.
                </p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {fautes.map((f) => (
                    <li key={f.id} className="space-y-1 rounded-inner border border-border bg-background-alt p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {f.type.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className="shrink-0 text-xs text-foreground-muted">
                          {formatDate(f.creeLe)}
                        </span>
                      </div>
                      {f.description && (
                        <p className="text-xs text-foreground-muted">{f.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {/* ── Actions ──────────────────────────────────────────────────── */}

        <footer className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill border border-border bg-background-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background-alt"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleBlock}
            className={cn(
              'rounded-pill px-4 py-2 text-sm font-semibold text-neutral-0 transition-colors',
              user.actif ? 'bg-error-600 hover:bg-error-700' : 'bg-button-primary hover:bg-button-primary-hover',
            )}
          >
            {user.actif ? 'Bloquer le compte' : 'Débloquer le compte'}
          </button>
        </footer>
      </div>
    </div>
  );
}