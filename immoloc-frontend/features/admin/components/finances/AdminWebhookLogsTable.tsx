'use client';

import { useState } from 'react';
import { FileCode2, CheckCircle2, XCircle, Eye, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface WebhookLogItem {
  id: string;
  provider: string;
  eventType?: string | null;
  payload?: any;
  isValid: boolean;
  errorMessage?: string | null;
  creeLe: string;
}

interface AdminWebhookLogsTableProps {
  logs: WebhookLogItem[];
  isLoading: boolean;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function AdminWebhookLogsTable({ logs, isLoading }: AdminWebhookLogsTableProps) {
  const [inspectLog, setInspectLog] = useState<WebhookLogItem | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-2">
        <FileCode2 className="h-10 w-10 text-foreground-muted mx-auto" />
        <h3 className="font-display text-base font-bold text-foreground">Aucun log de webhook enregistré</h3>
        <p className="text-xs text-foreground-muted">Les notifications PayDunya, Wave et Stripe reçues par le serveur apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-card border border-border bg-background-card shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-background-alt/50 font-display text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
            <tr>
              <th className="py-3 px-4">Horodatage & ID</th>
              <th className="py-3 px-4">Fournisseur de Paiement</th>
              <th className="py-3 px-4">Type d'Événement</th>
              <th className="py-3 px-4">Validité & Erreur</th>
              <th className="py-3 px-4 text-right">Inspection</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-background-alt/30">
                {/* Horodatage */}
                <td className="py-4 px-4 font-mono">
                  <p className="font-bold text-foreground">{formatDate(log.creeLe)}</p>
                  <p className="text-[0.6875rem] text-foreground-muted">{log.id.slice(0, 8)}...</p>
                </td>

                {/* Provider */}
                <td className="py-4 px-4">
                  <span className="font-bold text-foreground bg-background-alt px-2.5 py-1 rounded-pill border border-border text-xs uppercase">
                    {log.provider}
                  </span>
                </td>

                {/* Event Type */}
                <td className="py-4 px-4 font-mono text-xs">
                  {log.eventType ?? "Standard Webhook Notification"}
                </td>

                {/* Validité */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-[0.6875rem] font-bold",
                      log.isValid ? "border-forest-300 bg-forest-50 text-forest-800" : "border-error-300 bg-error-50 text-error-800"
                    )}>
                      {log.isValid ? <CheckCircle2 className="h-3 w-3 text-forest-600" /> : <XCircle className="h-3 w-3 text-error-600" />}
                      {log.isValid ? "Signature Valide" : "Invalide / Rejeté"}
                    </span>
                    {log.errorMessage && (
                      <p className="text-[0.6875rem] text-error-700 max-w-xs truncate font-medium">{log.errorMessage}</p>
                    )}
                  </div>
                </td>

                {/* Inspection */}
                <td className="py-4 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => setInspectLog(log)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-inner border border-border bg-background-card px-3 text-xs font-semibold text-foreground hover:bg-background-alt transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Payload JSON
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal JSON Webhook Payload */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-forest-700" /> Payload JSON du Webhook ({inspectLog.provider})
              </h3>
              <button type="button" onClick={() => setInspectLog(null)} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-inner border border-border bg-forest-950 p-4 text-neutral-0 font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(inspectLog.payload ?? inspectLog, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setInspectLog(null)} className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
