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
    <div className="bg-background-card rounded-card p-5 lg:p-6 border border-border/80 shadow-2xs hover:border-forest-600/30 hover:shadow-md transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarDays className="w-4 h-4 text-lime-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-forest-950">Agenda logistique</h3>
            {totalOccupied > 0 && (
              <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">
                {totalOccupied} jour{totalOccupied > 1 ? 's' : ''} d&apos;occupation
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-inner bg-background-alt flex items-center justify-center hover:bg-background-card transition-colors border border-border/60">
            <ChevronLeft className="w-4 h-4 text-forest-950" />
          </button>
          <span className="font-display text-xs font-extrabold text-forest-950 uppercase tracking-wider min-w-[100px] text-center">
            {MONTHS_FR[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-inner bg-background-alt flex items-center justify-center hover:bg-background-card transition-colors border border-border/60">
            <ChevronRight className="w-4 h-4 text-forest-950" />
          </button>
        </div>
      </div>

      {/* Grille calendrier + Agenda du jour */}
      <div className="grid lg:grid-cols-[1fr_200px] gap-6">
        {/* Calendrier */}
        <div>
          {/* En-têtes jours */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_FR.map(d => (
              <div key={d} className="py-1 text-center text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Cases */}
          <div className="grid grid-cols-7 gap-1.5">
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
                  className={`aspect-square flex flex-col items-center justify-center rounded-inner text-xs font-extrabold transition-all ${
                    isToday
                      ? 'bg-forest-950 text-white shadow-md'
                      : hasEvent
                        ? 'bg-forest-50 border border-forest-100 text-forest-950'
                        : 'hover:bg-background-alt text-forest-950'
                  }`}
                >
                  <span>{day}</span>
                  {hasEvent && !isToday && (
                    <div className="flex gap-1 mt-0.5">
                      {hasCheckin && <div className="w-1.5 h-1.5 rounded-full bg-lime-500" />}
                      {hasCheckout && <div className="w-1.5 h-1.5 rounded-full bg-warning-500" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda du jour */}
        <div className="border-t lg:border-t-0 lg:border-l border-border/60 pt-4 lg:pt-0 lg:pl-6 space-y-4">
          <div>
            <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider mb-0.5">Agenda du jour</p>
            <p className="font-display text-sm font-bold text-forest-950">
              {today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Départs */}
          <div className="p-3 rounded-inner bg-background-alt border border-border/60 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5 text-warning-600" />
              <span className="text-[10px] font-extrabold text-forest-950 uppercase tracking-wider">
                Départs ({todayEvents.filter(e => e.type === 'OUT').length})
              </span>
            </div>
            {todayEvents.filter(e => e.type === 'OUT').length === 0 ? (
              <p className="text-[10px] text-foreground-muted italic">Aucun départ prévu</p>
            ) : (
              todayEvents.filter(e => e.type === 'OUT').map(e => (
                <div key={e.id} className="pt-1">
                  <p className="font-display text-xs font-bold text-forest-950 truncate">{e.logement.titre}</p>
                  <p className="text-[10px] text-foreground-muted">Client : {e.locataire.prenom} {e.locataire.nom.charAt(0)}.</p>
                </div>
              ))
            )}
          </div>

          {/* Arrivées */}
          <div className="p-3 rounded-inner bg-background-alt border border-border/60 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5 text-lime-600" />
              <span className="text-[10px] font-extrabold text-forest-950 uppercase tracking-wider">
                Arrivées ({todayEvents.filter(e => e.type === 'IN').length})
              </span>
            </div>
            {todayEvents.filter(e => e.type === 'IN').length === 0 ? (
              <p className="text-[10px] text-foreground-muted italic">Aucune arrivée prévue</p>
            ) : (
              todayEvents.filter(e => e.type === 'IN').map(e => (
                <div key={e.id} className="pt-1">
                  <p className="font-display text-xs font-bold text-forest-950 truncate">{e.logement.titre}</p>
                  <p className="text-[10px] text-foreground-muted">Client : {e.locataire.prenom} {e.locataire.nom.charAt(0)}.</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
