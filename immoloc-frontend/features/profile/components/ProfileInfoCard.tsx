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
  iconCls,
  bgCls,
  borderCls,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconCls: string;
  bgCls: string;
  borderCls: string;
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${bgCls} ${borderCls}`}>
        <Icon className={`w-4 h-4 ${iconCls}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-neutral-900 truncate ${mono ? 'font-mono text-xs' : ''}`}>
          {value ?? <span className="text-neutral-300 font-normal italic text-xs">Non renseigné</span>}
        </p>
      </div>
    </div>
  );
}

/* ── Champ éditable ───────────────────────────────────────────────────────── */

function EditRow({
  icon: Icon,
  iconCls,
  bgCls,
  borderCls,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconCls: string;
  bgCls: string;
  borderCls: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${bgCls} ${borderCls}`}>
        <Icon className={`w-4 h-4 ${iconCls}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm font-semibold text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all placeholder:text-neutral-300 placeholder:font-normal"
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
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-lg hover:shadow-neutral-200/40 transition-all duration-300">

      {/* ── Header — bleu uniforme ──────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100 bg-emerald-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200 shrink-0">
            <User className="w-[17px] h-[17px] text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Profil</p>
            <h3 className="text-sm font-bold text-neutral-900">Informations personnelles</h3>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} disabled={isSaving}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-200 text-neutral-400 hover:text-rose-500 hover:border-rose-200 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold transition-colors disabled:opacity-60">
              {isSaving
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Check className="w-3 h-3" />}
              {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">
            <Pencil className="w-3 h-3" />
            Modifier
          </button>
        )}
      </div>

      {/* ── Erreur ─────────────────────────────────────────── */}
      {error && (
        <div className="mx-5 mt-3 flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-xl">
          <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <p className="text-xs text-rose-600 font-semibold">{error}</p>
        </div>
      )}

      {/* ── Champs ─────────────────────────────────────────── */}
      <div className="px-5 py-1">
        {isEditing ? (
          <>
            <EditRow icon={User}     iconCls="text-emerald-500" bgCls="bg-emerald-50"  borderCls="border-emerald-100"
              label="Prénom"           value={draft.prenom}        onChange={(v) => setDraft(d => ({ ...d, prenom: v }))}        placeholder="Votre prénom" />
            <EditRow icon={User}     iconCls="text-emerald-500" bgCls="bg-emerald-50"  borderCls="border-emerald-100"
              label="Nom de famille"   value={draft.nom}           onChange={(v) => setDraft(d => ({ ...d, nom: v }))}           placeholder="Votre nom" />
            <EditRow icon={Phone}    iconCls="text-emerald-500" bgCls="bg-emerald-50" borderCls="border-emerald-100"
              label="Téléphone"        value={draft.telephone}     onChange={(v) => setDraft(d => ({ ...d, telephone: v }))}     placeholder="+221 7X XXX XX XX" type="tel" />
            <EditRow icon={Calendar} iconCls="text-amber-500"   bgCls="bg-amber-50"   borderCls="border-amber-100"
              label="Date de naissance" value={draft.dateNaissance} onChange={(v) => setDraft(d => ({ ...d, dateNaissance: v }))} type="date" />
            {/* Email — toujours lecture seule */}
            <ReadRow icon={Mail} iconCls="text-violet-500" bgCls="bg-violet-50" borderCls="border-violet-100"
              label="Adresse e-mail (non modifiable)" value={user.email} />
            <ReadRow icon={Hash} iconCls="text-neutral-400" bgCls="bg-neutral-50" borderCls="border-neutral-100"
              label="Identifiant" value={user.id.slice(0, 16).toUpperCase()} mono />
          </>
        ) : (
          <>
            <ReadRow icon={User}     iconCls="text-emerald-500" bgCls="bg-emerald-50"  borderCls="border-emerald-100"  label="Prénom"            value={user.prenom} />
            <ReadRow icon={User}     iconCls="text-emerald-500" bgCls="bg-emerald-50"  borderCls="border-emerald-100"  label="Nom de famille"    value={user.nom} />
            <ReadRow icon={Mail}     iconCls="text-violet-500"  bgCls="bg-violet-50"   borderCls="border-violet-100"   label="Adresse e-mail"    value={user.email} />
            <ReadRow icon={Phone}    iconCls="text-emerald-500" bgCls="bg-emerald-50"  borderCls="border-emerald-100"  label="Téléphone"         value={user.telephone} />
            <ReadRow icon={Calendar} iconCls="text-amber-500"   bgCls="bg-amber-50"    borderCls="border-amber-100"    label="Date de naissance" value={dateFormatted} />
            <ReadRow icon={Hash}     iconCls="text-neutral-400" bgCls="bg-neutral-50"  borderCls="border-neutral-100"  label="Identifiant"       value={user.id.slice(0, 16).toUpperCase()} mono />
          </>
        )}
      </div>
    </div>
  );
}
