'use client';

import Image from 'next/image';
import {
  Eye, Lock, Unlock, RotateCcw, User, Home, CheckCircle2, XCircle,
  AlertTriangle, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface UserItem {
  id: string;
  userId?: string;
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  avatarUrl?: string;
  statutKyc: string;
  actif: boolean;
  bloqueJusqua?: string | null;
  estProprietaire: boolean;
  nbAnnulations?: number;
  nbAbsencesJourJ?: number;
  nbNonConformites?: number;
  creeLe?: string;
  _count?: {
    logements?: number;
    reservationsLocataire?: number;
    reservationsProprietaire?: number;
  };
}

interface Props {
  users: UserItem[];
  isLoading?: boolean;
  onInspect: (user: UserItem) => void;
  onBlockToggle: (user: UserItem) => void;
  onResetFaults: (user: UserItem) => void;
  onToggleRole: (user: UserItem) => void;
}

/* ⚠️ `warning-200`, `warning-300`, `warning-800`, `warning-900`, `error-200`,
   `error-800`, `forest-200`, `purple-*` et `blue-*` : aucune n'existe dans la
   palette (les rampes sémantiques s'arrêtent à 50/500/600/700). La plupart
   des badges de ce tableau s'affichaient sans bordure ni couleur. */
const KYC_CONFIG: Record<string, { label: string; badge: string }> = {
  VERIFIE: { label: 'Vérifié', badge: 'border-gold-200 bg-gold-50 text-gold-700' },
  EN_ATTENTE: { label: 'En attente', badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
  REJETE: { label: 'Rejeté', badge: 'border-error-500/25 bg-error-50 text-error-700' },
  NON_VERIFIE: { label: 'Non vérifié', badge: 'border-border bg-background-alt text-foreground-muted' },
  A_RENOUVELER: { label: 'À renouveler', badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
  SUSPENDU: { label: 'Suspendu', badge: 'border-error-500/25 bg-error-50 text-error-700' },
};

const formatDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const initials = (prenom?: string, nom?: string) =>
  `${prenom?.charAt(0) ?? ''}${nom?.charAt(0) ?? ''}`.toUpperCase() || '?';

export function AdminUsersTable({
  users, isLoading = false, onInspect, onBlockToggle, onResetFaults, onToggleRole,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-card border border-dashed border-border bg-background-card p-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill border border-border bg-background-alt text-foreground-muted">
          <User className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">
            Aucun utilisateur trouvé
          </p>
          <p className="text-xs text-foreground-muted">
            Ajustez votre recherche ou vos filtres.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background-alt text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            <tr>
              <th scope="col" className="px-4 py-3.5 sm:px-6">Utilisateur</th>
              <th scope="col" className="px-4 py-3.5">Rôle et KYC</th>
              <th scope="col" className="px-4 py-3.5">Compte</th>
              <th scope="col" className="px-4 py-3.5">Activité</th>
              <th scope="col" className="px-4 py-3.5">Fautes</th>
              <th scope="col" className="px-4 py-3.5 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const kyc = KYC_CONFIG[u.statutKyc] ?? KYC_CONFIG.NON_VERIFIE;
              const fautes =
                (u.nbAnnulations ?? 0) + (u.nbAbsencesJourJ ?? 0) + (u.nbNonConformites ?? 0);
              const nomComplet = [u.prenom, u.nom].filter(Boolean).join(' ') || 'Utilisateur';
              const logements = u._count?.logements ?? 0;
              const resasProprio = u._count?.reservationsProprietaire ?? 0;
              const resasLoc = u._count?.reservationsLocataire ?? 0;
              /* `bloqueJusqua` était dans le type sans jamais être affiché :
                 un blocage temporaire ressemblait à un blocage définitif. */
              const blocageTemporaire = !u.actif && u.bloqueJusqua
                ? formatDate(u.bloqueJusqua)
                : null;

              return (
                <tr key={u.id} className="transition-colors hover:bg-background-alt">

                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-pill border border-border bg-forest-100 text-sm font-semibold text-forest-800">
                        {u.avatarUrl ? (
                          <Image src={u.avatarUrl} alt="" fill sizes="40px" className="object-cover" unoptimized />
                        ) : initials(u.prenom, u.nom)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{nomComplet}</p>
                        <p className="max-w-[180px] truncate text-xs text-foreground-muted">
                          {u.email ?? '—'}
                        </p>
                        {u.telephone && (
                          <p className="text-xs tabular-nums text-foreground-muted">{u.telephone}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-xs font-semibold',
                        u.estProprietaire
                          ? 'border-forest-100 bg-forest-50 text-forest-700'
                          : 'border-border bg-background-alt text-foreground-muted',
                      )}>
                        {u.estProprietaire
                          ? <Home className="h-3 w-3" aria-hidden="true" />
                          : <User className="h-3 w-3" aria-hidden="true" />}
                        {u.estProprietaire ? 'Hôte' : 'Locataire'}
                      </span>
                      <span className={cn(
                        'inline-flex items-center rounded-pill border px-2 py-0.5 text-xs font-semibold',
                        kyc.badge,
                      )}>
                        {kyc.label}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold',
                      u.actif
                        ? 'border-forest-100 bg-forest-50 text-forest-700'
                        : 'border-error-500/25 bg-error-50 text-error-700',
                    )}>
                      {u.actif
                        ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        : <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                      {u.actif ? 'Actif' : 'Bloqué'}
                    </span>

                    {blocageTemporaire && (
                      <p className="mt-1 text-xs font-semibold text-error-700">
                        Jusqu’au {blocageTemporaire}
                      </p>
                    )}

                    {u.creeLe && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-foreground-muted">
                        <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {formatDate(u.creeLe)}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {u.estProprietaire ? (
                      <>
                        <p className="font-semibold tabular-nums text-foreground">
                          {logements} logement{logements > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          <span className="tabular-nums">{resasProprio}</span> reçue
                          {resasProprio > 1 ? 's' : ''}
                          {resasLoc > 0 && (
                            <> · <span className="tabular-nums">{resasLoc}</span> effectuée{resasLoc > 1 ? 's' : ''}</>
                          )}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold tabular-nums text-foreground">
                          {resasLoc} réservation{resasLoc > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-foreground-muted">Compte locataire</p>
                      </>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {fautes > 0 ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-pill border border-warning-500/25 bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-700">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          <span className="tabular-nums">{fautes}</span>
                        </span>
                        {/* « Annul: 2 | Abs: 1 | Conf: 0 » — des abréviations
                           que seul l'auteur du code comprend. */}
                        <p className="mt-1 text-xs text-foreground-muted">
                          {[
                            (u.nbAnnulations ?? 0) > 0 && `${u.nbAnnulations} annulation${u.nbAnnulations! > 1 ? 's' : ''}`,
                            (u.nbAbsencesJourJ ?? 0) > 0 && `${u.nbAbsencesJourJ} absence${u.nbAbsencesJourJ! > 1 ? 's' : ''}`,
                            (u.nbNonConformites ?? 0) > 0 && `${u.nbNonConformites} non-conformité${u.nbNonConformites! > 1 ? 's' : ''}`,
                          ].filter(Boolean).join(' · ')}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-foreground-muted">Aucune</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right sm:px-6">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspect(u)}
                        aria-label={`Consulter la fiche de ${nomComplet}`}
                        className="inline-flex h-8 items-center gap-1 rounded-pill border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Profil</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleRole(u)}
                        aria-label={
                          u.estProprietaire
                            ? `Retirer le rôle d’hôte à ${nomComplet}`
                            : `Donner le rôle d’hôte à ${nomComplet}`
                        }
                        className="inline-flex h-8 items-center gap-1 rounded-pill border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                      >
                        <Home className="h-3.5 w-3.5" aria-hidden="true" />
                        {/* « - Hôte » / « + Hôte » : illisible, et l'action
                           n'est pas anodine — elle retire l'accès aux
                           annonces publiées. */}
                        <span className="hidden sm:inline">
                          {u.estProprietaire ? 'Retirer hôte' : 'Passer hôte'}
                        </span>
                      </button>

                      {fautes > 0 && (
                        <button
                          type="button"
                          onClick={() => onResetFaults(u)}
                          aria-label={`Réinitialiser les fautes de ${nomComplet}`}
                          className="inline-flex h-8 items-center gap-1 rounded-pill border border-warning-500/25 bg-warning-50 px-2.5 text-xs font-semibold text-warning-700 transition-colors hover:bg-warning-50/70"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="hidden lg:inline">Réinitialiser</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onBlockToggle(u)}
                        aria-label={
                          u.actif ? `Bloquer le compte de ${nomComplet}` : `Débloquer ${nomComplet}`
                        }
                        className={cn(
                          'inline-flex h-8 items-center gap-1 rounded-pill border px-2.5 text-xs font-semibold transition-colors',
                          u.actif
                            ? 'border-error-500/25 bg-background-card text-error-700 hover:bg-error-50'
                            : 'border-forest-100 bg-forest-50 text-forest-700 hover:bg-forest-100',
                        )}
                      >
                        {u.actif
                          ? <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                          : <Unlock className="h-3.5 w-3.5" aria-hidden="true" />}
                        <span className="hidden sm:inline">{u.actif ? 'Bloquer' : 'Débloquer'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}