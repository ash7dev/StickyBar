'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { User, Mail, Phone, Calendar, Hash, Pencil, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onUpdated?: () => void;
}

/** Date civile lisible, sans conversion UTC. */
function formatDateCivile(iso?: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const toDraft = (user: UserProfile) => ({
  prenom: user.prenom ?? '',
  nom: user.nom ?? '',
  telephone: user.telephone ?? '',
  dateNaissance: user.dateNaissance?.slice(0, 10) ?? '',
});

/* ── Champs ───────────────────────────────────────────────────────────────── */

function FieldShell({
  icon: Icon, label, htmlFor, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? 'label' : 'p';
  return (
    <div className="flex items-center gap-3.5 rounded-inner border border-border bg-background-alt p-3.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <Label
          {...(htmlFor ? { htmlFor } : {})}
          className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted"
        >
          {label}
        </Label>
        {children}
      </div>
    </div>
  );
}

function ReadRow({
  icon, label, value, mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <FieldShell icon={icon} label={label}>
      <p className={cn('truncate text-sm font-semibold text-foreground', mono && 'tabular-nums tracking-wider')}>
        {value ?? <span className="font-normal text-foreground-muted">Non renseigné</span>}
      </p>
    </FieldShell>
  );
}

function EditRow({
  icon, label, value, onChange, type = 'text', placeholder, autoComplete,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <FieldShell icon={icon} label={label} htmlFor={id}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-field border border-border bg-background-card px-3 py-2 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
      />
    </FieldShell>
  );
}

/* ── Composant ────────────────────────────────────────────────────────────── */

export function ProfileInfoCard({ user, onUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => toDraft(user));

  /* `useState` n'initialise qu'une fois : après un refetch, `draft` gardait
     les anciennes valeurs et les réécrivait par-dessus les nouvelles. */
  useEffect(() => {
    if (!isEditing) setDraft(toDraft(user));
  }, [user, isEditing]);

  const set = useCallback(
    (k: keyof ReturnType<typeof toDraft>) => (v: string) => setDraft((d) => ({ ...d, [k]: v })),
    [],
  );

  const handleCancel = useCallback(() => {
    setDraft(toDraft(user));
    setError(null);
    setIsEditing(false);
  }, [user]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      await nestFetch(NEST_API.USERS.ME, {
        method: 'PATCH',
        /* `|| undefined` retirait la clé du corps : un champ vidé était
           ignoré par l'API et réapparaissait après sauvegarde. On envoie
           `null` pour effacer réellement. */
        body: JSON.stringify({
          prenom: draft.prenom.trim() || null,
          nom: draft.nom.trim() || null,
          telephone: draft.telephone.trim() || null,
          dateNaissance: draft.dateNaissance || null,
        }),
      });
      setIsEditing(false);
      onUpdated?.();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : 'Impossible de sauvegarder. Réessayez dans un instant.',
      );
    } finally {
      setIsSaving(false);
    }
  }, [draft, onUpdated]);

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm">

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <User className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-foreground">
              Informations personnelles
            </h2>
            <p className="text-xs text-foreground-muted">Identité et coordonnées</p>
          </div>
        </div>

        {isEditing ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              aria-label="Annuler les modifications"
              className="flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-background-alt text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
            {/* ★ Seul aplat lime de la carte : l'action d'enregistrement. */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-pill bg-action px-4 py-2 text-xs font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover active:scale-[0.98] disabled:opacity-60"
            >
              {isSaving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-border bg-background-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Modifier
          </button>
        )}
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-inner border border-error-500/20 bg-error-50 px-3.5 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
          <p className="text-xs text-error-700">{error}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {isEditing ? (
          <>
            <EditRow icon={User} label="Prénom" value={draft.prenom} onChange={set('prenom')} placeholder="Votre prénom" autoComplete="given-name" />
            <EditRow icon={User} label="Nom de famille" value={draft.nom} onChange={set('nom')} placeholder="Votre nom" autoComplete="family-name" />
            <FieldShell icon={Phone} label="Téléphone">
              <PhoneInputWithCountry
                value={draft.telephone}
                onChange={set('telephone')}
              />
            </FieldShell>
            <EditRow icon={Calendar} label="Date de naissance" value={draft.dateNaissance} onChange={set('dateNaissance')} type="date" autoComplete="bday" />
          </>
        ) : (
          <>
            <ReadRow icon={User} label="Prénom" value={user.prenom} />
            <ReadRow icon={User} label="Nom de famille" value={user.nom} />
            <ReadRow icon={Phone} label="Téléphone" value={user.telephone} />
            <ReadRow icon={Calendar} label="Date de naissance" value={formatDateCivile(user.dateNaissance)} />
          </>
        )}
      </div>
    </section>
  );
}