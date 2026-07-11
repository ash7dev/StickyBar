import { Banknote, Shield, CalendarCheck, CalendarX, Users, Moon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fcfa, dateLong } from '@/features/reservations/utils';
import { DarkCard, DarkCardHeader } from '../shared/reservation-cards';
import type { ReservationDetail } from '@/lib/nestjs/types';

type FinancialProps = Pick<
  ReservationDetail,
  'nbNuits' | 'nbPersonnes' | 'dateDebut' | 'dateFin' | 'totalLocataire'
>;

export function TenantFinancialCard({ nbNuits, nbPersonnes, dateDebut, dateFin, totalLocataire }: FinancialProps) {
  const prixNuitTTC = Math.round(totalLocataire / nbNuits);

  const details: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon: <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />,
      label: 'Arrivée',
      value: dateLong(dateDebut),
    },
    {
      icon: <CalendarX className="w-3.5 h-3.5 text-rose-400" />,
      label: 'Départ',
      value: dateLong(dateFin),
    },
    {
      icon: <Moon className="w-3.5 h-3.5 text-emerald-400" />,
      label: 'Durée',
      value: `${nbNuits} nuit${nbNuits > 1 ? 's' : ''}`,
    },
    {
      icon: <Users className="w-3.5 h-3.5 text-neutral-400" />,
      label: 'Voyageurs',
      value: `${nbPersonnes} personne${nbPersonnes > 1 ? 's' : ''}`,
    },
  ];

  return (
    <DarkCard>
      <DarkCardHeader icon={<Banknote className="w-4 h-4 text-neutral-400" />} title="Récapitulatif du séjour" />
      <div className="p-6 space-y-5">

        {/* Détails séjour */}
        <div className="grid grid-cols-2 gap-3">
          {details.map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-2.5 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
                <p className="text-xs font-bold text-white mt-0.5 leading-snug">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Prix */}
        <div className="border-t border-white/8 pt-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-neutral-500">
              {nbNuits} nuit{nbNuits > 1 ? 's' : ''} × {fcfa(prixNuitTTC)} FCFA
            </span>
            <span className="text-base font-black text-neutral-300 tabular-nums">{fcfa(totalLocataire)}</span>
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-emerald-500/15 to-emerald-600/10 border border-emerald-400/20 px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-300 uppercase tracking-wide">Total payé</span>
            <div className="text-right">
              <span className="text-2xl font-black text-white tracking-tight tabular-nums">{fcfa(totalLocataire)}</span>
              <span className="text-xs font-bold text-emerald-400 ml-1.5">FCFA</span>
            </div>
          </div>
        </div>

        {/* Séquestre */}
        <div className="flex items-start gap-3 bg-emerald-500/8 border border-emerald-400/15 rounded-xl p-4">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300 font-medium leading-relaxed">
            Votre paiement est sécurisé par séquestre. Les fonds sont libérés à l&apos;hôte uniquement après confirmation de votre check-in.
          </p>
        </div>

      </div>
    </DarkCard>
  );
}
