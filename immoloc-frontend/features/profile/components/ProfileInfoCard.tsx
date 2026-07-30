'use client';

import { useState } from 'react';
import { User, Mail, Phone, Calendar, Hash, Pencil, Check, X, Loader2 } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onUpdated?: () => void;
}

/* ── Champ lecture seule ──────────────────────────────────────────────────── */

function ReadRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 flex items-center gap-3.5">
      <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-lime-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-xs font-bold text-forest-950 truncate ${mono ? 'font-mono' : ''}`}>
          {value ?? <span className="text-foreground-faint font-normal italic">Non renseigné</span>}
        </p>
      </div>
    </div>
  );
}

/* ── Champ éditable ───────────────────────────────────────────────────────── */

function EditRow({
  icon: Icon,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 flex items-center gap-3.5 relative">
      <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-lime-400" />
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider mb-1">{label}</p>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-xs font-bold text-forest-950 bg-background-card border border-border rounded-inner px-3 py-1.5 outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 transition-all placeholder:text-foreground-faint placeholder:font-normal relative z-20"
        />
      </div>
    </div>
  );
}

/* ── Composant principal ──────────────────────────────────────────────────── */

export function ProfileInfoCard({ user, onUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const [draft, setDraft] = useState({
    prenom:        user.prenom ?? '',
    nom:           user.nom ?? '',
    telephone:     user.telephone ?? '',
    dateNaissance: user.dateNaissance?.slice(0, 10) ?? '',
  });

  const dateFormatted = user.dateNaissance
    ? new Date(user.dateNaissance).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  function handleCancel() {
    setDraft({
      prenom:        user.prenom ?? '',
      nom:           user.nom ?? '',
      telephone:     user.telephone ?? '',
      dateNaissance: user.dateNaissance?.slice(0, 10) ?? '',
    });
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await nestFetch(NEST_API.USERS.ME, {
        method: 'PATCH',
        body: JSON.stringify({
          prenom:        draft.prenom.trim()        || undefined,
          nom:           draft.nom.trim()           || undefined,
          telephone:     draft.telephone.trim()     || undefined,
          dateNaissance: draft.dateNaissance        || undefined,
        }),
      });
      setIsEditing(false);
      onUpdated?.();
    } catch {
      setError('Impossible de sauvegarder. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0 shadow-2xs">
            <User className="w-4 h-4 text-lime-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-forest-950">Informations personnelles</h3>
            <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">Identité & Coordonnées</p>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="w-8 h-8 flex items-center justify-center rounded-inner bg-background-alt border border-border text-foreground-muted hover:text-error-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Sauvegarde…' : 'Sauvegarder'}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 text-xs font-extrabold transition-all shadow-md active:scale-95"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Modifier</span>
          </button>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-error-50 border border-error-200 rounded-inner">
          <X className="w-4 h-4 text-error-600 shrink-0" />
          <p className="text-xs text-error-700 font-bold">{error}</p>
        </div>
      )}

      {/* Grille de champs */}
      <div className="grid sm:grid-cols-2 gap-3 overflow-visible">
        {isEditing ? (
          <>
            <EditRow icon={User} label="Prénom" value={draft.prenom} onChange={(v) => setDraft(d => ({ ...d, prenom: v }))} placeholder="Votre prénom" />
            <EditRow icon={User} label="Nom de famille" value={draft.nom} onChange={(v) => setDraft(d => ({ ...d, nom: v }))} placeholder="Votre nom" />
            <EditRow icon={Phone} label="Téléphone" value={draft.telephone} onChange={(v) => setDraft(d => ({ ...d, telephone: v }))} placeholder="+221 7X XXX XX XX" type="tel" />
            <EditRow icon={Calendar} label="Date de naissance" value={draft.dateNaissance} onChange={(v) => setDraft(d => ({ ...d, dateNaissance: v }))} type="date" />
            <ReadRow icon={Mail} label="Adresse e-mail (non modifiable)" value={user.email} />
            <ReadRow icon={Hash} label="Identifiant" value={user.id.slice(0, 16).toUpperCase()} mono />
          </>
        ) : (
          <>
            <ReadRow icon={User} label="Prénom" value={user.prenom} />
            <ReadRow icon={User} label="Nom de famille" value={user.nom} />
            <ReadRow icon={Mail} label="Adresse e-mail" value={user.email} />
            <ReadRow icon={Phone} label="Téléphone" value={user.telephone} />
            <ReadRow icon={Calendar} label="Date de naissance" value={dateFormatted} />
            <ReadRow icon={Hash} label="Identifiant" value={user.id.slice(0, 16).toUpperCase()} mono />
          </>
        )}
      </div>
    </div>
  );
}
