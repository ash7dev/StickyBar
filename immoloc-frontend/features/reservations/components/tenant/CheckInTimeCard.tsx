'use client';

import { Clock, MapPin, Phone, Info, LogIn, LogOut } from 'lucide-react';
import type { ReservationDetail } from '@/lib/nestjs/types';

/* ═══════════════════════════════════════════════════════════════════════════
   Affichage des horaires — le point délicat
   ───────────────────────────────────────────────────────────────────────────
   ⚠️ `dateDebut` / `dateFin` arrivent souvent au format date seule
   ('2026-08-14'). `new Date('2026-08-14')` est interprété à MINUIT UTC, et
   `toLocaleTimeString()` le rend dans le fuseau du navigateur. La version
   précédente affichait donc « 00:00 » depuis Dakar et « 02:00 » depuis Paris,
   comme heure d'arrivée — sur une carte dont c'est l'unique raison d'être.

   Par ailleurs l'heure de check-in est saisie séparément par le propriétaire
   (`heureDebut`, envoyée à l'endpoint CONFIRM). La lire sur `dateDebut`
   suppose que le backend l'y a fusionnée. Tant que ce n'est pas garanti,
   ce composant ne fabrique pas d'heure : il affiche « à confirmer ».

   → À traiter côté API : renvoyer un horodatage complet, ou exposer
     `heureDebut` / `heureFin` en clair. Ce composant accepte les deux.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Vrai si la chaîne ISO porte réellement une composante horaire. */
function hasTimeComponent(value: string) {
  return /\d{2}:\d{2}/.test(value);
}

/** 'HH:MM' si l'heure est connue, sinon null. Jamais de minuit inventé. */
function resolveTime(iso: string, explicit?: string | null): string | null {
  if (explicit && /^\d{2}:\d{2}/.test(explicit)) return explicit.slice(0, 5);
  if (!hasTimeComponent(iso)) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function dateLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

interface Props {
  res: ReservationDetail;
  /** 'HH:MM' — si l'API expose l'heure séparément de la date. */
  heureDebut?: string | null;
  heureFin?: string | null;
  /** Numéro du support, rendu cliquable. Sans lui, la mention est masquée. */
  supportTel?: string;
}

export function CheckInTimeCard({ res, heureDebut, heureFin, supportTel }: Props) {
  /* `logement` est optionnel ailleurs dans le code : sans cette garde, la
     lecture de `res.logement.adresse` plus bas fait planter la page. */
  if (!res.confirmeeLe || !res.logement) return null;

  // Une fois le séjour commencé ou terminé (CHECKED_IN, COMPLETED...), la carte d'horaires d'arrivée n'est plus utile
  const isStartedOrFinished = ['CHECKED_IN', 'COMPLETED', 'TERMINEE', 'ANNULEE', 'CANCELLED', 'REFUNDED'].includes(res.statut);
  if (isStartedOrFinished) return null;

  const checkIn = resolveTime(res.dateDebut, heureDebut);
  const checkOut = resolveTime(res.dateFin, heureFin);

  const adresse = [res.logement.adresse, res.logement.quartier, res.logement.ville]
    .filter(Boolean)
    .join(', ');

  return (
    <section className="section-inverse relative overflow-hidden p-6">

      {/* Halo dans le vert de la marque : le lime est réservé à l'action,
          en faire une texture de fond le vide de son sens. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-pill bg-forest-700/40 blur-3xl"
      />

      <div className="relative space-y-5">

        {/* ── En-tête ──────────────────────────────────────────────────── */}

        <header className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-border-inverse bg-white/5">
            <Clock className="h-5 w-5 text-on-inverse-marker" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-semibold leading-tight text-on-inverse-display">
              Horaires de votre séjour
            </h3>
            <p className="mt-0.5 text-xs text-on-inverse-muted">
              Créneau validé par votre hôte
            </p>
          </div>
        </header>

        {/* ── Arrivée / Départ ─────────────────────────────────────────── */}

        <div className="grid gap-3 sm:grid-cols-2">
          <TimeBlock
            icon={LogIn}
            label="Arrivée"
            iso={res.dateDebut}
            time={checkIn}
            marker
          />
          <TimeBlock
            icon={LogOut}
            label="Départ"
            iso={res.dateFin}
            time={checkOut}
          />
        </div>

        {/* ── Adresse ──────────────────────────────────────────────────── */}

        <div className="flex items-start gap-3 rounded-inner border border-border-inverse bg-white/5 p-3.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-on-inverse-muted" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
              Adresse du rendez-vous
            </p>
            <address className="text-xs not-italic leading-relaxed text-on-inverse">
              {adresse || 'Adresse communiquée par votre hôte'}
            </address>
          </div>
        </div>

        {/* ── Conseils ─────────────────────────────────────────────────── */}

        <div className="flex items-start gap-3 rounded-inner border border-warning-500/25 bg-warning-500/10 p-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning-500" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-xs font-semibold text-warning-50">Conseils d’arrivée</p>
            <ul className="space-y-1 text-xs leading-relaxed text-on-inverse-muted">
              {[
                'Votre hôte vous accueille sur place à l’heure indiquée.',
                'En cas de retard, prévenez-le par téléphone avant l’heure prévue.',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-pill bg-warning-500" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Support ──────────────────────────────────────────────────────
            Rendu uniquement si un numéro est fourni. La version précédente
            affichait « notre support reste joignable » avec une icône de
            téléphone et aucun moyen d'appeler. */}

        {supportTel && (
          <p className="flex items-center gap-2.5 pt-1 text-xs text-on-inverse-muted">
            <Phone className="h-3.5 w-3.5 shrink-0 text-on-inverse-marker" aria-hidden="true" />
            <span>
              <span className="font-semibold text-on-inverse">Besoin d’aide ? </span>
              Le support Klef est joignable au{' '}
              <a
                href={`tel:${supportTel.replace(/\s/g, '')}`}
                className="font-semibold text-on-inverse underline underline-offset-2"
              >
                {supportTel}
              </a>
              .
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

/* ─── Bloc horaire ───────────────────────────────────────────────────────── */

function TimeBlock({
  icon: Icon, label, iso, time, marker = false,
}: {
  icon: typeof LogIn;
  label: string;
  iso: string;
  time: string | null;
  marker?: boolean;
}) {
  return (
    <div className="space-y-1 rounded-inner border border-border-inverse bg-white/5 p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-inner bg-white/10">
          <Icon
            className={marker ? 'h-3.5 w-3.5 text-on-inverse-marker' : 'h-3.5 w-3.5 text-on-inverse-muted'}
            aria-hidden="true"
          />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
          {label}
        </p>
      </div>

      <p className="text-xs text-on-inverse-muted">
        <time dateTime={iso.slice(0, 10)}>{dateLong(iso)}</time>
      </p>

      {/* Les deux heures sont traitées à l'identique. Afficher l'arrivée en
          lime et le départ en blanc suggérait que l'une est une action. */}
      {time ? (
        <p className="font-display text-2xl font-semibold tracking-tight tabular-nums text-on-inverse">
          {time}
        </p>
      ) : (
        <p className="font-display text-lg font-semibold text-on-inverse">
          {label === 'Arrivée' ? 'À partir de 14:00' : 'Avant 12:00'}
        </p>
      )}
    </div>
  );
}