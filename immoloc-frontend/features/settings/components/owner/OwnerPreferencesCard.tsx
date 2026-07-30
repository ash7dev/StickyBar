'use client';

import { useState } from 'react';
import { Bell, Save, Loader2, CheckCircle2 } from 'lucide-react';

export function OwnerPreferencesCard() {
  const [instantBooking, setInstantBooking] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailStatements, setEmailStatements] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 500);
  };

  return (
    <div className="card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/80">
        <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shrink-0 shadow-xs">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Préférences d'Accueil & Alertes</h2>
          <p className="text-xs text-foreground-muted">Configurez vos règles de réservation et vos canaux de notification</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-3 p-3.5 rounded-inner bg-success-50 border border-success-500/30 text-success-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
          <span>Préférences enregistrées.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <label className="flex items-start gap-3.5 cursor-pointer p-4 rounded-inner bg-background-alt/60 hover:bg-background-alt border border-border/60 transition-colors">
          <input
            type="checkbox"
            checked={instantBooking}
            onChange={(e) => setInstantBooking(e.target.checked)}
            className="mt-1 w-4 h-4 accent-forest-600 rounded"
          />
          <div>
            <p className="text-xs font-bold text-foreground">Confirmation Instantanée des Réservations</p>
            <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
              Les voyageurs ayant un profil vérifié par Klef peuvent réserver votre logement sans attente de validation manuelle sous 24h.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3.5 cursor-pointer p-4 rounded-inner bg-background-alt/60 hover:bg-background-alt border border-border/60 transition-colors">
          <input
            type="checkbox"
            checked={whatsappAlerts}
            onChange={(e) => setWhatsappAlerts(e.target.checked)}
            className="mt-1 w-4 h-4 accent-forest-600 rounded"
          />
          <div>
            <p className="text-xs font-bold text-foreground">Alertes Instantanées WhatsApp & SMS</p>
            <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
              Recevez une notification urgente par WhatsApp et SMS lors de l'arrivée d'une réservation ou du signalement d'un voyageur.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3.5 cursor-pointer p-4 rounded-inner bg-background-alt/60 hover:bg-background-alt border border-border/60 transition-colors">
          <input
            type="checkbox"
            checked={emailStatements}
            onChange={(e) => setEmailStatements(e.target.checked)}
            className="mt-1 w-4 h-4 accent-forest-600 rounded"
          />
          <div>
            <p className="text-xs font-bold text-foreground">Relevés Mensuels & Quittances</p>
            <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
              Recevez les récapitulatifs comptables et les justificatifs de reversement au début de chaque mois.
            </p>
          </div>
        </label>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-action px-6 text-xs justify-center cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
            ) : (
              <><Save className="w-4 h-4" /> Enregistrer</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
