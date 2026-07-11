import { Clock, MapPin, Phone, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
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
    minute: '2-digit'
  });

  const checkOutTime = new Date(res.dateFin).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 rounded-2xl border border-primary-700/50 shadow-xl shadow-primary-950/40">
      {/* Effet de brillance */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500/10 rounded-full blur-2xl" />

      <div className="relative p-6 space-y-5">
        {/* En-tête */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Clock className="w-6 h-6 text-primary-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white leading-tight">
              Horaires définis par le propriétaire
            </h3>
            <p className="text-xs text-primary-300 mt-1 font-medium">
              Votre réservation a été confirmée avec des horaires précis
            </p>
          </div>
        </div>

        {/* Horaires */}
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Check-in */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-primary-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-primary-400">
                Arrivée prévue
              </p>
            </div>
            <p className="text-sm font-medium text-white/60 mb-1">
              {dateLong(res.dateDebut)}
            </p>
            <p className="text-2xl font-black text-white tracking-tight">
              {checkInTime}
            </p>
          </div>

          {/* Check-out */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-rose-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                Départ prévu
              </p>
            </div>
            <p className="text-sm font-medium text-white/60 mb-1">
              {dateLong(res.dateFin)}
            </p>
            <p className="text-2xl font-black text-white tracking-tight">
              {checkOutTime}
            </p>
          </div>
        </div>

        {/* Adresse du logement */}
        <div className="flex items-start gap-3 bg-primary-600/10 border border-primary-500/20 rounded-xl p-4">
          <MapPin className="w-4 h-4 text-primary-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-primary-400 mb-1">
              Adresse du rendez-vous
            </p>
            <p className="text-sm font-semibold text-white leading-relaxed">
              {res.logement.adresse}
              {res.logement.quartier && `, ${res.logement.quartier}`}
              {`, ${res.logement.ville}`}
            </p>
          </div>
        </div>

        {/* Informations importantes */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-400/20 rounded-xl p-4">
          <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-200 mb-2">
              Points importants
            </p>
            <ul className="space-y-1.5 text-xs text-amber-100/90 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span>Le propriétaire vous attendra à l'heure indiquée</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span>En cas d'imprévu, contactez-le directement par téléphone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span>Prévoyez d'arriver 5-10 minutes avant l'heure prévue</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Support */}
        <div className="flex items-center gap-2.5 text-xs text-primary-300">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <p>
            <span className="font-bold text-white">Besoin d'aide ?</span>
            {' '}Notre support est disponible 24/7 via WhatsApp ou téléphone
          </p>
        </div>
      </div>
    </div>
  );
}
