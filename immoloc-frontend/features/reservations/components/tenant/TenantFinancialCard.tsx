'use client';

import { Banknote, Shield, CalendarCheck, CalendarX, Users, Moon } from 'lucide-react';
import { fcfa, dateLong } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

type FinancialProps = Pick<
  ReservationDetail,
  'nbNuits' | 'nbPersonnes' | 'dateDebut' | 'dateFin' | 'totalLocataire'
>;

export function TenantFinancialCard({ nbNuits, nbPersonnes, dateDebut, dateFin, totalLocataire }: FinancialProps) {
  const prixNuitTTC = Math.round(totalLocataire / nbNuits);

  const details: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon: <CalendarCheck className="w-3.5 h-3.5 text-lime-400" />,
      label: 'Arrivée',
      value: dateLong(dateDebut),
    },
    {
      icon: <CalendarX className="w-3.5 h-3.5 text-forest-300" />,
      label: 'Départ',
      value: dateLong(dateFin),
    },
    {
      icon: <Moon className="w-3.5 h-3.5 text-lime-400" />,
      label: 'Durée',
      value: `${nbNuits} nuit${nbNuits > 1 ? 's' : ''}`,
    },
    {
      icon: <Users className="w-3.5 h-3.5 text-forest-300" />,
      label: 'Voyageurs',
      value: `${nbPersonnes} personne${nbPersonnes > 1 ? 's' : ''}`,
    },
  ];

  return (
    <div className="bg-forest-950 text-white rounded-card border border-forest-800/90 p-6 space-y-5 shadow-xl relative overflow-hidden">
      {/* Halo de fond */}
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-lime-400/10 blur-2xl" />

      {/* En-tête */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-forest-800/80">
        <div className="w-8 h-8 rounded-inner bg-forest-900 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
          <Banknote className="w-4 h-4 text-lime-400" />
        </div>
        <h4 className="font-display text-base font-bold text-white">Récapitulatif du séjour</h4>
      </div>

      <div className="space-y-4">
        {/* Grille 2x2 des détails */}
        <div className="grid grid-cols-2 gap-3">
          {details.map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-2.5 bg-forest-900/50 border border-forest-800/60 rounded-inner p-3">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-300">{label}</p>
                <p className="text-xs font-bold text-white mt-0.5 leading-snug">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Décomposition Prix */}
        <div className="border-t border-forest-800/80 pt-4 space-y-3">
          <div className="flex items-baseline justify-between text-xs text-forest-200">
            <span>{nbNuits} nuit{nbNuits > 1 ? 's' : ''} × {fcfa(prixNuitTTC)} FCFA</span>
            <span className="font-mono font-bold text-white">{fcfa(totalLocataire)} FCFA</span>
          </div>

          <div className="rounded-inner bg-forest-900/90 border border-lime-400/30 p-4 flex items-center justify-between shadow-2xs">
            <span className="text-xs font-extrabold uppercase tracking-wider text-forest-200">Total Réglé (Séquestre)</span>
            <div className="text-right">
              <span className="font-display text-2xl font-extrabold text-lime-400 leading-none">{fcfa(totalLocataire)}</span>
              <span className="text-xs font-bold text-lime-200 ml-1.5">FCFA</span>
            </div>
          </div>
        </div>

        {/* Bandeau de Garantie Séquestre */}
        <div className="flex items-start gap-3 bg-lime-400/10 border border-lime-400/20 rounded-inner p-3.5">
          <Shield className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
          <p className="text-xs text-lime-200 font-medium leading-relaxed">
            Votre paiement est sécurisé sous séquestre par Klef. Les fonds sont libérés au propriétaire uniquement après confirmation de votre entrée dans les lieux.
          </p>
        </div>
      </div>
    </div>
  );
}
