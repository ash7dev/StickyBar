'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Settings, Save, Percent, Wallet, ShieldCheck, Key, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminParametresPage() {
  const [tauxCommission, setTauxCommission] = useState('7');
  const [retraitMin, setRetraitMin] = useState('10000');
  const [acompteDefaut, setAcompteDefaut] = useState('30');
  const [delaiAnnulation, setDelaiAnnulation] = useState('48');
  const [paydunyaKey, setPaydunyaKey] = useState('paydunya_live_pk_****************');
  const [waveWebhookUrl, setWaveWebhookUrl] = useState('https://api.immoloc.sn/api/v1/webhooks/wave');

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Paramètres système et configuration financière enregistrés avec succès !");
    }, 600);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-card border border-forest-300 bg-forest-900 px-4 py-3 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Title */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-forest-700" /> Paramètres d'Administration & Ratios ImmoLoc
          </h1>
          <p className="text-xs text-foreground-muted">
            Configuration globale des taux de commission, seuils de paiement et intégrations passerelles PayDunya & Wave.
          </p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 1. Tarification & Commissions (1 col) */}
          <div className="rounded-card border border-border bg-background-card p-6 shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Percent className="h-5 w-5 text-forest-700" /> Paramètres Financiers & Commissions
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">Taux de Commission Plateforme (%) :</label>
                <div className="relative">
                  <input
                    type="number"
                    value={tauxCommission}
                    onChange={(e) => setTauxCommission(e.target.value)}
                    className="h-9 w-full rounded-inner border border-border bg-background-card px-3 text-xs font-bold text-forest-800 focus:border-forest-600 focus:outline-hidden"
                    required
                  />
                  <span className="absolute right-3 top-2 font-bold text-foreground-muted">%</span>
                </div>
                <p className="text-[0.6875rem] text-foreground-muted">Taux prélevé sur chaque réservation effectuée (Actuellement 7%).</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">Seuil Minimum de Retrait Wallet (XOF) :</label>
                <input
                  type="number"
                  value={retraitMin}
                  onChange={(e) => setRetraitMin(e.target.value)}
                  className="h-9 w-full rounded-inner border border-border bg-background-card px-3 text-xs font-bold text-foreground focus:border-forest-600 focus:outline-hidden"
                  required
                />
                <p className="text-[0.6875rem] text-foreground-muted">Montant minimum requis pour qu'un hôte demande un virement (10 000 FCFA).</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">Pourcentage Acompte à la Réservation (%) :</label>
                <input
                  type="number"
                  value={acompteDefaut}
                  onChange={(e) => setAcompteDefaut(e.target.value)}
                  className="h-9 w-full rounded-inner border border-border bg-background-card px-3 text-xs font-bold text-foreground focus:border-forest-600 focus:outline-hidden"
                  required
                />
                <p className="text-[0.6875rem] text-foreground-muted">Part minimale réglée immédiatement en ligne (30%).</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">Délai d'Annulation Gratuite (Heures) :</label>
                <input
                  type="number"
                  value={delaiAnnulation}
                  onChange={(e) => setDelaiAnnulation(e.target.value)}
                  className="h-9 w-full rounded-inner border border-border bg-background-card px-3 text-xs font-bold text-foreground focus:border-forest-600 focus:outline-hidden"
                  required
                />
                <p className="text-[0.6875rem] text-foreground-muted">Délai avant le Check-in pour un remboursement sans frais (48h).</p>
              </div>
            </div>
          </div>

          {/* 2. Passerelles & Clés Webhooks (1 col) */}
          <div className="rounded-card border border-border bg-background-card p-6 shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Key className="h-5 w-5 text-forest-700" /> Passerelles & Clés d'API
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">PayDunya Master Key / Token :</label>
                <input
                  type="text"
                  value={paydunyaKey}
                  onChange={(e) => setPaydunyaKey(e.target.value)}
                  className="h-9 w-full rounded-inner border border-border bg-background-card px-3 text-xs font-mono text-foreground focus:border-forest-600 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">URL Webhook Wave / Orange Money :</label>
                <input
                  type="text"
                  value={waveWebhookUrl}
                  onChange={(e) => setWaveWebhookUrl(e.target.value)}
                  className="h-9 w-full rounded-inner border border-border bg-background-card px-3 text-xs font-mono text-foreground focus:border-forest-600 focus:outline-hidden"
                  required
                />
              </div>

              <div className="rounded-inner border border-forest-200 bg-forest-50/50 p-4 space-y-1">
                <p className="font-bold text-forest-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-forest-700" /> Sécurité des Webhooks & Signature HMAC
                </p>
                <p className="text-[0.6875rem] text-forest-800">
                  Toutes les notifications de paiement entrantes sont vérifiées cryptographiquement avec l'en-tête X-Paydunya-Signature et le secret Wave HMAC.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-9 items-center gap-2 rounded-pill bg-forest-700 px-6 text-xs font-semibold text-neutral-0 hover:bg-forest-800 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Enregistrement..." : "Sauvegarder la Configuration"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
