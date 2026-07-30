'use client';

import { useState, useEffect } from 'react';
import { User, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';

interface Props {
  prenomInitial?: string;
  nomInitial?: string;
  telephoneInitial?: string;
  emailInitial?: string;
  onUpdated?: () => void;
}

export function OwnerProfileInfoCard({
  prenomInitial = '',
  nomInitial = '',
  telephoneInitial = '',
  emailInitial = '',
  onUpdated,
}: Props) {
  const [prenom, setPrenom] = useState(prenomInitial);
  const [nom, setNom] = useState(nomInitial);
  const [telephone, setTelephone] = useState(telephoneInitial);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setPrenom(prenomInitial);
    setNom(nomInitial);
    setTelephone(telephoneInitial);
  }, [prenomInitial, nomInitial, telephoneInitial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await nestFetch(NEST_API.USERS.ME, {
        method: 'PATCH',
        body: JSON.stringify({ prenom, nom, telephone }),
      });
      setSaveSuccess(true);
      if (onUpdated) onUpdated();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur de mise à jour du profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/80">
        <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shrink-0 shadow-xs">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Informations Personnelles</h2>
          <p className="text-xs text-foreground-muted">Modifiez l'identité affichée sur vos annonces et quittances</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-3 p-3.5 rounded-inner bg-success-50 border border-success-500/30 text-success-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
          <span>Informations enregistrées avec succès.</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 p-3.5 rounded-inner bg-error-50 border border-error-500/30 text-error-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-error-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="eyebrow block mb-2">Prénom</label>
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className="w-full px-4 py-3 rounded-field bg-background-alt border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-500/20 transition-all"
              required
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Nom</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-4 py-3 rounded-field bg-background-alt border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-500/20 transition-all"
              required
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Téléphone WhatsApp</label>
            <input
              type="text"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="77 123 45 67"
              className="w-full px-4 py-3 rounded-field bg-background-alt border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-500/20 transition-all"
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Adresse E-mail (Identifiant)</label>
            <input
              type="email"
              value={emailInitial}
              disabled
              className="w-full px-4 py-3 rounded-field bg-background-alt/60 border border-border text-sm font-medium text-foreground-muted cursor-not-allowed"
            />
          </div>
        </div>

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
