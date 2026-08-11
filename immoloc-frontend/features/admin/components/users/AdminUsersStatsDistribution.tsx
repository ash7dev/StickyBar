'use client';

import type { ComponentType } from 'react';
import { Home, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminUsersStatsDistributionProps {
  counts: {
    total: number;
    proprietaires: number;
    locataires: number;
    bloques: number;
    kycAttente: number;
  };
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const plur = (n: number, mot: string, p = `${mot}s`) => (n > 1 ? p : mot);

/* ─── Briques ─────────────────────────────────────────────────────────────── */

function Carte({
  icon: Icon,
  titre,
  valeur,
  ton = 'neutre',
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  titre: string;
  valeur?: React.ReactNode;
  ton?: 'neutre' | 'alerte';
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-card border border-border bg-background-card p-4">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Icon
            className={cn('h-4 w-4 shrink-0', ton === 'alerte' ? 'text-warning-600' : 'text-forest-600')}
            aria-hidden
          />
          {titre}
        </h3>
        {valeur}
      </header>
      {children}
    </section>
  );
}

/** Barre de proportion, avec son libellé accessible. */
function Barre({
  segments,
  label,
}: {
  segments: { pct: number; classe: string; nom: string }[];
  label: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-2 w-full overflow-hidden rounded-pill bg-background-alt"
    >
      {segments.map((s) => (
        <span
          key={s.nom}
          style={{ width: `${s.pct}%` }}
          className={cn('h-full', s.classe)}
        />
      ))}
    </div>
  );
}

function Legende({ classe, valeur, libelle }: { classe: string; valeur: number; libelle: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
      <span aria-hidden className={cn('h-2 w-2 shrink-0 rounded-pill', classe)} />
      <span className="tabular-nums">{fmt(valeur)}</span> {libelle}
    </span>
  );
}

/* ─── Composant ───────────────────────────────────────────────────────────── */

export function AdminUsersStatsDistribution({ counts }: AdminUsersStatsDistributionProps) {
  const { total, proprietaires, locataires, bloques, kycAttente } = counts;

  /* `total || 1` remplaçait un dénominateur nul par 1 : sur une base vide,
     bloques/1 = 0 %, donc « 100 % actifs » alors qu'il n'y a personne.
     Un état vide se dit, il ne se calcule pas. */
  if (total <= 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-background-card p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Aucun compte à analyser</p>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Les répartitions apparaîtront dès les premières inscriptions.
        </p>
      </div>
    );
  }

  const pct = (n: number) => Math.round((n / total) * 100);

  const hotesPct = pct(proprietaires);
  const locatairesPct = pct(locataires);

  const actifs = Math.max(0, total - bloques);
  /* Un seul arrondi, l'autre est déduit. Deux Math.round indépendants
     donnaient 34 + 67 = 101 et la barre débordait de son conteneur. */
  const bloquesPct = pct(bloques);
  const actifsPct = 100 - bloquesPct;

  const kycOk = kycAttente === 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* ── 1. Rôles ──────────────────────────────────────────────────────
          Un compte peut être hôte ET locataire. Ce ne sont donc pas deux
          parts d'un tout : une barre empilée additionnerait des ensembles qui
          se recouvrent et pourrait dépasser 100 %. Deux mesures indépendantes,
          chacune rapportée au total. */}
      <Carte icon={Home} titre="Rôles">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-foreground-muted">Hôtes</span>
              <span className="tabular-nums text-foreground">
                <span className="font-semibold">{fmt(proprietaires)}</span>
                <span className="text-foreground-muted"> · {hotesPct} %</span>
              </span>
            </div>
            <Barre
              label={`Hôtes : ${fmt(proprietaires)} comptes, soit ${hotesPct} % du total`}
              segments={[{ pct: hotesPct, classe: 'bg-forest-600', nom: 'hotes' }]}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-foreground-muted">Locataires</span>
              <span className="tabular-nums text-foreground">
                <span className="font-semibold">{fmt(locataires)}</span>
                <span className="text-foreground-muted"> · {locatairesPct} %</span>
              </span>
            </div>
            <Barre
              label={`Locataires : ${fmt(locataires)} comptes, soit ${locatairesPct} % du total`}
              segments={[{ pct: locatairesPct, classe: 'bg-info-500', nom: 'locataires' }]}
            />
          </div>

          <p className="text-xs text-foreground-muted">
            Un compte peut cumuler les deux rôles — les deux mesures se recouvrent.
          </p>
        </div>
      </Carte>

      {/* ── 2. Comptes actifs / bloqués ───────────────────────────────────
          Ceux-là s'excluent vraiment : une barre empilée est justifiée. */}
      <Carte
        icon={UserCheck}
        titre="Comptes actifs"
        valeur={
          <span className="text-xs tabular-nums text-foreground-muted">{actifsPct} %</span>
        }
      >
        <div className="space-y-2">
          <Barre
            label={`${fmt(actifs)} comptes actifs, ${fmt(bloques)} bloqués`}
            segments={[
              { pct: actifsPct, classe: 'bg-forest-600', nom: 'actifs' },
              { pct: bloquesPct, classe: 'bg-error-500', nom: 'bloques' },
            ]}
          />
          <div className="flex items-center justify-between gap-3">
            <Legende classe="bg-forest-600" valeur={actifs} libelle="actifs" />
            <Legende classe="bg-error-500" valeur={bloques} libelle="bloqués" />
          </div>
        </div>
      </Carte>

      {/* ── 3. File d'attente KYC ─────────────────────────────────────────
          Plus de barre. Le ratio à la base entière rendait le backlog
          invisible : 40 dossiers sur 10 000 comptes affichaient 0 %, alors que
          40 dossiers, c'est une journée de travail. Ce qui compte ici est un
          nombre absolu, pas une proportion. */}
      <Carte
        icon={kycOk ? ShieldCheck : UserX}
        titre="Dossiers KYC"
        ton={kycOk ? 'neutre' : 'alerte'}
      >
        <div className="space-y-1">
          <p
            className={cn(
              'font-display text-3xl font-semibold leading-none tabular-nums',
              kycOk ? 'text-foreground' : 'text-warning-700',
            )}
          >
            {fmt(kycAttente)}
          </p>
          <p className="text-xs text-foreground-muted">
            {kycOk
              ? 'Aucun dossier en attente.'
              : `${plur(kycAttente, 'dossier')} en attente de vérification.`}
          </p>
          {/* « Urgent » était dans le titre en permanence, y compris à zéro
             dossier. L'urgence se déduit du chiffre, elle ne s'affirme pas. */}
          {!kycOk && (
            <p className="pt-1 text-xs text-foreground-muted">
              Sans validation, ces comptes ne peuvent ni publier ni réserver.
            </p>
          )}
        </div>
      </Carte>
    </div>
  );
}