'use client';

import { useState } from 'react';
import { Building2, Check, Loader2, Mail, Phone, Save, User } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';

interface Props {
  user: {
    id?: string;
    prenom?: string;
    nom?: string;
    email?: string;
    telephone?: string;
    avatarUrl?: string | null;
  } | null;
  onProfileUpdated?: () => void;
}

export function GestionnaireParametresProfileCard({ user, onProfileUpdated }: Props) {
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [nom, setNom] = useState(user?.nom || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [nomAgence, setNomAgence] = useState('Klef Conciergerie - Dakar Prestige');
  const [emailPro, setEmailPro] = useState(user?.email || '');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    setErrorMessage(null);

    try {
      await nestFetch(NEST_API.USERS.ME, {
        method: 'PATCH',
        body: JSON.stringify({
          prenom,
          nom,
          telephone,
        }),
      });

      setSavedSuccess(true);
      if (onProfileUpdated) onProfileUpdated();

      setTimeout(() => {
        setSavedSuccess(false);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="rounded-card border shadow-2xs p-6 sm:p-7 space-y-6"
      style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
    >
      {/* ── Titre de section ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
            style={{ background: 'var(--forest-50)' }}
          >
            <Building2 className="w-5 h-5" style={{ color: 'var(--forest-700)' }} />
          </div>
          <div>
            <h2
              className="font-display text-lg font-bold tracking-tight"
              style={{ color: 'var(--forest-900)' }}
            >
              Identité de l'Agence &amp; Concierge
            </h2>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
              Informations visibles par les propriétaires et sur les reçus de gestion.
            </p>
          </div>
        </div>
      </div>

      {/* ── Formulaire de modification ──────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Messages Feedback */}
        {savedSuccess && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-inner text-xs font-bold"
            style={{
              background: 'var(--success-50)',
              color: 'var(--success-700)',
              border: '1px solid var(--success-500)',
            }}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>Modifications enregistrées avec succès !</span>
          </div>
        )}

        {errorMessage && (
          <div
            className="px-4 py-3 rounded-inner text-xs font-semibold"
            style={{
              background: 'var(--error-50)',
              color: 'var(--error-700)',
              border: '1px solid var(--error-500)',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Avatar / Enseigne Initials */}
        <div className="flex items-center gap-4 py-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-2xs shrink-0"
            style={{
              background: 'var(--forest-50)',
              color: 'var(--forest-700)',
              border: '1px solid var(--forest-200)',
            }}
          >
            {prenom[0] || 'G'}
            {nom[0] || 'C'}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--forest-950)' }}>
              {prenom || 'Gestionnaire'} {nom || 'Conciergerie'}
            </p>
            <p className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
              Gestionnaire agréé Klef Conciergerie
            </p>
          </div>
        </div>

        {/* Grid des champs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nom de l'Enseigne Conciergerie */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
              Nom de l'Agence Conciergerie
            </label>
            <div className="relative">
              <Building2
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--foreground-muted)' }}
              />
              <input
                type="text"
                value={nomAgence}
                onChange={(e) => setNomAgence(e.target.value)}
                placeholder="ex: Dakar Horizon Conciergerie"
                className="w-full rounded-pill border pl-9 pr-4 py-2.5 text-xs font-medium outline-none transition-colors bg-white [color-scheme:light]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          {/* Prénom */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
              Prénom du Responsable
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--foreground-muted)' }}
              />
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                required
                className="w-full rounded-pill border pl-9 pr-4 py-2.5 text-xs font-medium outline-none transition-colors bg-white [color-scheme:light]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
              Nom de Famille
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--foreground-muted)' }}
              />
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Votre nom"
                required
                className="w-full rounded-pill border pl-9 pr-4 py-2.5 text-xs font-medium outline-none transition-colors bg-white [color-scheme:light]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          {/* Téléphone Pro */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
              Téléphone Professionnel (WhatsApp)
            </label>
            <PhoneInputWithCountry
              value={telephone}
              onChange={setTelephone}
            />
          </div>

          {/* Email Pro */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
              Adresse Email Officielle
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--foreground-muted)' }}
              />
              <input
                type="email"
                value={emailPro}
                onChange={(e) => setEmailPro(e.target.value)}
                placeholder="conciergerie@exemple.sn"
                readOnly
                className="w-full rounded-pill border pl-9 pr-4 py-2.5 text-xs font-medium outline-none bg-neutral-100 cursor-not-allowed"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}
              />
            </div>
            <p className="text-[0.65rem] font-medium" style={{ color: 'var(--foreground-muted)' }}>
              L'email de connexion est lié à votre compte principal.
            </p>
          </div>
        </div>

        {/* Pied d'action */}
        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-action inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Mettre à jour le profil</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
