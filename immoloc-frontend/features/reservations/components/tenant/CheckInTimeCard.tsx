'use client';

import { Clock, MapPin, Phone, Info } from 'lucide-react';
import type { ReservationDetail } from '@/lib/nestjs/types';

function dateLong(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function CheckInTimeCard({ res }: { res: ReservationDetail }) {
  // Afficher uniquement si la réservation est confirmée et qu'il y a une heure
  if (!res.confirmeeLe) return null;

  const checkInTime = new Date(res.dateDebut).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const checkOutTime = new Date(res.dateFin).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative overflow-hidden bg-forest-950 text-white rounded-card border border-forest-800/90 shadow-xl p-6 space-y-5">
      {/* Halos de fond */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-lime-400/10 blur-3xl" />

      {/* En-tête */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-inner bg-forest-900 border border-lime-400/20 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-lime-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold text-white leading-tight">
            Horaires confirmés pour votre rendez-vous
          </h3>
          <p className="text-xs text-forest-300 mt-0.5 font-medium">
            Votre propriétaire a validé votre créneau d&apos;arrivée
          </p>
        </div>
      </div>

      {/* Horaires Arrivée / Départ */}
      <div className="grid sm:grid-cols-2 gap-3">
        {/* Check-in */}
        <div className="bg-forest-900/60 border border-forest-800/80 rounded-inner p-4 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-inner bg-lime-400/20 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-lime-400" />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-lime-300">
              Arrivée prévue
            </p>
          </div>
          <p className="text-xs font-medium text-forest-200">
            {dateLong(res.dateDebut)}
          </p>
          <p className="font-display text-2xl font-extrabold text-lime-400 tracking-tight">
            {checkInTime}
          </p>
        </div>

        {/* Check-out */}
        <div className="bg-forest-900/60 border border-forest-800/80 rounded-inner p-4 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-inner bg-forest-800 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-forest-300" />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-300">
              Départ prévu
            </p>
          </div>
          <p className="text-xs font-medium text-forest-200">
            {dateLong(res.dateFin)}
          </p>
          <p className="font-display text-2xl font-extrabold text-white tracking-tight">
            {checkOutTime}
          </p>
        </div>
      </div>

      {/* Adresse du logement */}
      <div className="flex items-start gap-3 bg-forest-900/40 border border-forest-800/60 rounded-inner p-3.5">
        <MapPin className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-300 mb-0.5">
            Adresse de rendez-vous
          </p>
          <p className="text-xs font-bold text-white leading-relaxed">
            {res.logement.adresse}
            {res.logement.quartier && `, ${res.logement.quartier}`}
            {`, ${res.logement.ville}`}
          </p>
        </div>
      </div>

      {/* Points importants */}
      <div className="flex items-start gap-3 bg-warning-50/10 border border-warning-400/20 rounded-inner p-3.5">
        <Info className="w-4 h-4 text-warning-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-warning-300 mb-1.5">
            Conseils d&apos;arrivée
          </p>
          <ul className="space-y-1 text-xs text-warning-200/90 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-warning-400 shrink-0 mt-1.5" />
              <span>Le propriétaire vous accueillera sur place à l&apos;heure indiquée</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-warning-400 shrink-0 mt-1.5" />
              <span>En cas de retard, prévenez votre hôte par téléphone</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Support */}
      <div className="flex items-center gap-2.5 text-xs text-forest-300 pt-1">
        <Phone className="w-3.5 h-3.5 text-lime-400 shrink-0" />
        <p>
          <span className="font-bold text-white">Besoin d&apos;aide ?</span>
          {' '}Notre support Klef reste joignable à tout moment.
        </p>
      </div>
    </div>
  );
}
