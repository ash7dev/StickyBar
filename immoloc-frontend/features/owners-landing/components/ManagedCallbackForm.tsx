'use client';

import { useId, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';

const VILLES = ['Dakar', 'Saly', 'Somone', 'Ngaparou', 'Saint-Louis', 'Autre'];
const TYPES = ['Appartement', 'Villa', 'Studio', 'Chambre'];

const LABEL = 'flex flex-col gap-1.5 text-[13px] font-semibold text-foreground';
const INPUT =
  'h-12 w-full rounded-field border border-border bg-background-card px-3.5 text-base text-foreground outline-none focus:border-forest-600 focus:ring-2 focus:ring-ring';

/**
 * Demande Paixi Managed : arrive dans l'onglet « Demandes » des gestionnaires.
 * Numéro libre (international accepté) : beaucoup de propriétaires vivent à l'étranger.
 */
export function ManagedCallbackForm() {
  const id = useId();
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', ville: 'Dakar', typeBien: 'Appartement', nombreLogements: 1 });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const phoneOk = form.telephone.replace(/\D/g, '').length >= 8;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOk) {
      setError('Indiquez un numéro joignable, avec l’indicatif si vous êtes à l’étranger.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await nestFetch('/api/v1/concierge-leads', { method: 'POST', body: JSON.stringify(form), skipAutoToken: true });
      setSent(true);
    } catch (err) {
      setError((err as Error)?.message || 'L’envoi n’a pas abouti. Réessayez ou écrivez-nous sur WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-background p-8 text-center sm:p-10" role="status">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-400 text-forest-950">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="text-2xl">C’est noté, {form.prenom} !</h3>
        <p className="max-w-sm text-[15px] leading-relaxed text-foreground-muted">
          Un gestionnaire Paixi vous recontacte au {form.telephone}, par appel ou sur WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-[2rem] bg-background p-6 sm:p-9" aria-labelledby={`${id}-title`}>
      <div className="flex flex-col gap-1.5">
        <h3 id={`${id}-title`} className="text-2xl sm:text-3xl">Être rappelé par un gestionnaire</h3>
        <p className="text-[15px] text-foreground-muted">Gratuit et sans engagement. Par appel ou sur WhatsApp.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={LABEL}>
          Prénom
          <input className={INPUT} required autoComplete="given-name" value={form.prenom} onChange={(e) => set('prenom', e.target.value)} placeholder="Aminata" />
        </label>
        <label className={LABEL}>
          Nom
          <input className={INPUT} required autoComplete="family-name" value={form.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Diop" />
        </label>
      </div>
      <label className={LABEL}>
        Numéro WhatsApp
        <input className={INPUT} required type="tel" autoComplete="tel" inputMode="tel" value={form.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="+221 77 123 45 67" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={LABEL}>
          Ville du bien
          <select className={INPUT} value={form.ville} onChange={(e) => set('ville', e.target.value)}>
            {VILLES.map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className={LABEL}>
          Type de bien
          <select className={INPUT} value={form.typeBien} onChange={(e) => set('typeBien', e.target.value)}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <label className={LABEL}>
        Nombre de logements
        <input
          className={INPUT}
          type="number"
          min={1}
          max={50}
          value={form.nombreLogements}
          onChange={(e) => set('nombreLogements', Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
        />
      </label>
      {error && <p className="text-sm font-medium text-error-600" role="alert">{error}</p>}
      <button type="submit" disabled={loading} className="btn-action mt-1 w-full py-4">
        {loading ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />Envoi…</> : 'Être rappelé'}
      </button>
      <p className="text-center text-xs leading-relaxed text-foreground-muted">Vos coordonnées servent uniquement à vous recontacter.</p>
    </form>
  );
}
