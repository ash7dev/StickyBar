'use client';

import { CalendarDays, ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';

interface Event {
  id: string;
  dateDebut?: string;
  dateFin?: string;
  locataire: { prenom: string; nom: string };
  logement: { titre: string };
}

interface Props {
  checkins: Event[];
  checkouts: Event[];
}

const DAYS_FR = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function DashboardCalendar({ checkins, checkouts }: Props) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const checkinDates = new Set(checkins.map(e => new Date(e.dateDebut!).toDateString()));
  const checkoutDates = new Set(checkouts.map(e => new Date(e.dateFin!).toDateString()));

  const todayEvents = [
    ...checkins.filter(e => new Date(e.dateDebut!).toDateString() === today.toDateString())
      .map(e => ({ ...e, type: 'IN' as const })),
    ...checkouts.filter(e => new Date(e.dateFin!).toDateString() === today.toDateString())
      .map(e => ({ ...e, type: 'OUT' as const })),
  ];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const totalOccupied = checkinDates.size + checkoutDates.size;

  return (
    <div className="bg-background rounded-2xl p-6 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-foreground-muted" />
          <h3 className="text-sm font-black text-foreground">Agenda logistique</h3>
          {totalOccupied > 0 && (
            <span className="text-[10px] font-medium text-foreground-muted">
              {totalOccupied} jour{totalOccupied > 1 ? 's' : ''} occupé{totalOccupied > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-background-alt flex items-center justify-center hover:bg-background-card transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-foreground-muted" />
          </button>
          <span className="text-xs font-black text-foreground uppercase tracking-wider w-28 text-center">
            {MONTHS_FR[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-background-alt flex items-center justify-center hover:bg-background-card transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-foreground-muted" />
          </button>
        </div>
      </div>

      {/* Grille calendrier + Agenda du jour */}
      <div className="grid lg:grid-cols-[1fr_160px] gap-4">
        {/* Calendrier */}
        <div>
          {/* En-têtes jours */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map(d => (
              <div key={d} className="py-1 text-center text-[10px] font-black text-foreground-muted uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Cases */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;

              const dateStr = new Date(year, month, day).toDateString();
              const isToday = new Date(year, month, day).toDateString() === today.toDateString();
              const hasCheckin = checkinDates.has(dateStr);
              const hasCheckout = checkoutDates.has(dateStr);
              const hasEvent = hasCheckin || hasCheckout;

              return (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                    isToday
                      ? 'bg-neutral-900 text-white'
                      : hasEvent
                        ? 'bg-success-500/10 text-foreground'
                        : 'hover:bg-background-alt text-foreground'
                  }`}
                >
                  <span>{day}</span>
                  {hasEvent && !isToday && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasCheckin && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                      {hasCheckout && <div className="w-1 h-1 rounded-full bg-warning-500" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda du jour */}
        <div className="border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-4">
          <p className="text-[10px] font-black text-foreground-muted uppercase tracking-wider mb-1">Agenda du jour</p>
          <p className="text-sm font-black text-foreground mb-4">
            {today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {/* Départs */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <LogOut className="w-3.5 h-3.5 text-warning-500" />
              <span className="text-[10px] font-black text-foreground-muted uppercase tracking-wider">
                Départs ({todayEvents.filter(e => e.type === 'OUT').length})
              </span>
            </div>
            {todayEvents.filter(e => e.type === 'OUT').length === 0 ? (
              <p className="text-[10px] text-foreground-muted italic pl-1">Aucun départ prévu</p>
            ) : (
              todayEvents.filter(e => e.type === 'OUT').map(e => (
                <div key={e.id} className="pl-1 mb-1.5">
                  <p className="text-xs font-bold text-foreground truncate">{e.logement.titre}</p>
                  <p className="text-[10px] text-foreground-muted">Cli : {e.locataire.prenom} {e.locataire.nom.charAt(0)}.</p>
                </div>
              ))
            )}
          </div>

          {/* Retours */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <LogIn className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-foreground-muted uppercase tracking-wider">
                Retours ({todayEvents.filter(e => e.type === 'IN').length})
              </span>
            </div>
            {todayEvents.filter(e => e.type === 'IN').length === 0 ? (
              <p className="text-[10px] text-foreground-muted italic pl-1">Aucune arrivée prévue</p>
            ) : (
              todayEvents.filter(e => e.type === 'IN').map(e => (
                <div key={e.id} className="pl-1 mb-1.5">
                  <p className="text-xs font-bold text-foreground truncate">{e.logement.titre}</p>
                  <p className="text-[10px] text-foreground-muted">Cli : {e.locataire.prenom} {e.locataire.nom.charAt(0)}.</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
