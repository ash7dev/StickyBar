'use client';

import { ShieldCheck, History, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface AuditEventItem {
  id: string;
  type: string;
  details: string;
  date: string;
  status: 'SUCCESS' | 'INFO';
}

interface AdminAuditLogWidgetProps {
  logs?: AuditEventItem[];
  isLoading?: boolean;
}

export function AdminAuditLogWidget({ logs = [], isLoading = false }: AdminAuditLogWidgetProps) {
  if (isLoading) {
    return (
      <div className="h-56 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-xs sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
            <History className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Journal d'Audit & Traçabilité de Sécurité
            </h2>
            <p className="text-xs text-foreground-muted">
              Historique des opérations administratives et modifications sensibles
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-pill bg-forest-50 border border-forest-200 px-3 py-1 text-xs font-semibold text-forest-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          Audit Immuable
        </span>
      </div>

      {logs.length > 0 ? (
        <div className="space-y-2.5">
          {logs.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-inner border border-border bg-background-alt/40 p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-inner bg-forest-50 text-forest-700 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-pill bg-forest-50 border border-forest-200 px-2 py-0.5 text-[0.625rem] font-bold text-forest-800 uppercase">
                      {event.type}
                    </span>
                    <p className="truncate text-xs font-semibold text-foreground">{event.details}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[0.6875rem] font-medium text-foreground-muted shrink-0">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(event.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-background-alt text-foreground-muted">
            <History className="h-5 w-5" />
          </span>
          <p className="text-xs font-semibold text-foreground">Aucune entrée d'audit récente</p>
          <p className="text-[0.75rem] text-foreground-muted">Les actions d'administration seront consignées ici.</p>
        </div>
      )}
    </div>
  );
}
