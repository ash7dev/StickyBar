'use client';

import { Banknote, Shield, CalendarCheck, CalendarX, Users, Moon } from 'lucide-react';
import { fcfa, dateLong } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

type FinancialProps = Pick<
  ReservationDetail,
  'nbNuits' | 'nbPersonnes' | 'dateDebut' | 'dateFin' | 'totalLocataire'
> & {
  /**
   * Lignes réelles du calcul, si l'API les expose.
   *
   * ⚠️ Sans elles, ce composant n'INVENTE PAS de décomposition. La version
   * précédente affichait « N nuits × (total ÷ N) » face au total, ce qui
   * produisait une équation tautologique (total = total) et surtout un prix
   * par nuit qui n'existe nulle part : `totalLocataire` contient déjà les
   * suppléments voyageurs, les réductions séjour long et la majoration
   * publique. Le locataire lisait donc, sur son récapitulatif de paiement, un
   * tarif à la nuit différent de celui affiché sur la fiche du logement.
   */
  totalNuits?: number | string;
  supplementPersonnes?: number | string;
  reductionNuits?: number | string;
};

export function TenantFinancialCard({
  nbNuits,
  nbPersonnes,
  dateDebut,
  dateFin,
  totalLocataire,
  totalNuits,
  supplementPersonnes,
  reductionNuits,
}: FinancialProps) {
  const total = Number(totalLocataire) || 0;
  const nuits = Number(nbNuits) || 0;

  /* Moyenne, présentée comme telle. `nbNuits` à 0 donnait Infinity. */
  const moyenneParNuit = nuits > 0 ? Math.round(total / nuits) : null;

  const hasBreakdown = totalNuits != null;
  const supplement = Number(supplementPersonnes) || 0;
  const reduction = Number(reductionNuits) || 0;

  const details = [
    { icon: CalendarCheck, label: 'Arrivée', value: dateLong(dateDebut) },
    { icon: CalendarX, label: 'Départ', value: dateLong(dateFin) },
    { icon: Moon, label: 'Durée', value: `${nuits} nuit${nuits > 1 ? 's' : ''}` },
    { icon: Users, label: 'Voyageurs', value: `${nbPersonnes} personne${nbPersonnes > 1 ? 's' : ''}` },
  ];

  return (
    <section className="section-inverse relative overflow-hidden p-6">
      {/* Halo dans le vert de la marque : le lime marque l'action, il ne
          sert pas de texture de fond. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-pill bg-forest-700/40 blur-3xl"
      />

      <div className="relative space-y-5">

        <header className="flex items-center gap-2.5 border-b border-border-inverse pb-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-border-inverse bg-white/5">
            <Banknote className="h-4 w-4 text-on-inverse-marker" aria-hidden="true" />
          </span>
          <h3 className="font-display text-base font-semibold text-on-inverse-display">
            Récapitulatif du séjour
          </h3>
        </header>

        {/* ── Détails ──────────────────────────────────────────────────── */}

        <dl className="grid grid-cols-2 gap-3">
          {details.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-start gap-2.5 rounded-inner border border-border-inverse bg-white/5 p-3"
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-on-inverse-muted" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                  {label}
                </dt>
                <dd className="mt-0.5 text-xs font-semibold leading-snug text-on-inverse">
                  {value}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        {/* ── Montants ─────────────────────────────────────────────────── */}

        <div className="space-y-3 border-t border-border-inverse pt-4">

          {hasBreakdown ? (
            <dl className="space-y-2.5">
              <Line label={`Hébergement · ${nuits} nuit${nuits > 1 ? 's' : ''}`} value={totalNuits} />
              {supplement > 0 && (
                <Line label={`Supplément voyageurs`} value={supplement} prefix="+" />
              )}
              {reduction > 0 && (
                <Line label="Réduction séjour long" value={reduction} prefix="−" />
              )}
            </dl>
          ) : (
            moyenneParNuit !== null && (
              <p className="text-xs text-on-inverse-muted">
                Soit{' '}
                <span className="font-semibold tabular-nums text-on-inverse">
                  {fcfa(moyenneParNuit)} FCFA
                </span>{' '}
                par nuit en moyenne, suppléments et réductions inclus.
              </p>
            )
          )}

          <div className="flex items-center justify-between gap-3 rounded-inner border border-border-inverse bg-white/[0.07] p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
              Total réglé
            </span>
            <span className="text-right">
              <span className="font-display text-2xl font-semibold leading-none tabular-nums text-on-inverse">
                {fcfa(total)}
              </span>
              <span className="ml-1.5 text-xs font-semibold text-on-inverse-muted">FCFA</span>
            </span>
          </div>
        </div>

        {/* ── Garantie séquestre ───────────────────────────────────────── */}

        <div className="flex items-start gap-3 rounded-inner border border-border-inverse bg-white/5 p-3.5">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-on-inverse-marker" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-on-inverse-muted">
            <span className="font-semibold text-on-inverse">Paiement sous séquestre. </span>
            Les fonds ne sont versés à l’hôte qu’après confirmation de votre entrée dans les
            lieux.
          </p>
        </div>
      </div>
    </section>
  );
}

function Line({
  label, value, prefix,
}: {
  label: string;
  value: number | string;
  prefix?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <dt className="text-on-inverse-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-on-inverse">
        {prefix}
        {fcfa(Number(value) || 0)} FCFA
      </dd>
    </div>
  );
}