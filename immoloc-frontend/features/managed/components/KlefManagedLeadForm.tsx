'use client';

import { useId, useState } from 'react';
import { Building2, CheckCircle2, Mail, MapPin, Phone, Send, User } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';

const LABEL_CLS = 'mb-1 block text-xs font-semibold text-forest-900';

/** Validation téléphone souple pour le Sénégal (70, 75, 76, 77, 78) */
function looksLikeValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '').replace(/^221/, '');
  return /^7[05678]\d{7}$/.test(digits);
}

/* L'input reste toujours à 16px (via .field) même si le label ou l'aide
   autour descend à text-xs : en dessous, Safari zoome au focus.           */
function Field({
  icon: Icon, id, label, required, ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  label: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLS}>
        {label} {required && <span className="text-error-600" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <span className="field-affix">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <input id={id} required={required} {...props} className="field pl-10" />
      </div>
    </div>
  );
}

export function KlefManagedLeadForm() {
  const ids = {
    prenom: useId(), nom: useId(), telephone: useId(), email: useId(),
    ville: useId(), typeBien: useId(), nombreLogements: useId(),
  };

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState('');
  const [typeBien, setTypeBien] = useState('Appartement');
  const [nombreLogements, setNombreLogements] = useState(1);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phoneTouched = telephone.replace(/\D/g, '').length >= 8;
  const phoneLooksOff = phoneTouched && !looksLikeValidPhone(telephone);

  function handleNombreLogements(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    setNombreLogements(digits ? Math.min(50, Math.max(1, Number(digits))) : 1);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await nestFetch('/api/v1/concierge-leads', {
        method: 'POST',
        body: JSON.stringify({ prenom, nom, telephone, email, ville, typeBien, nombreLogements }),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Une erreur est survenue lors de l'envoi de votre demande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="formulaire-managed"
      className="mx-auto max-w-lg space-y-4 rounded-card border border-border bg-background-card p-5 shadow-xl sm:p-7"
    >
      <div className="space-y-1 text-center">
        <div className="icon-tile mx-auto h-10 w-10 shadow-xs">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-base sm:text-lg">Demander une prise en charge Klef Managed</h2>
        <p className="text-xs text-foreground-muted">
          Laissez vos coordonnées et notre équipe vous recontactera sous 24h.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-3 rounded-inner border border-success-200 bg-success-50 p-6 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-success-600 text-neutral-0 shadow-xs">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm text-success-800">Demande enregistrée !</h3>
            <p className="mx-auto max-w-xs text-xs leading-relaxed text-success-700">
              Merci {prenom} {nom}. Notre équipe vous contactera très rapidement par téléphone ou
              WhatsApp au <strong className="font-semibold">{telephone}</strong>.
            </p>
          </div>
          {/* .btn-ghost, pas un badge-brand : action secondaire, pas un tag
              d'identité — le seul moment lime de l'écran reste le vrai
              bouton d'envoi, pas ce bouton de reprise.                    */}
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setPrenom('');
              setNom('');
              setTelephone('');
              setEmail('');
            }}
            className="btn-ghost mx-auto py-2 text-xs"
          >
            Soumettre une autre demande
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div role="alert" className="rounded-inner border border-error-200 bg-error-50 p-3 text-xs font-semibold text-error-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              icon={User} id={ids.prenom} label="Prénom" required
              type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Ex : Moussa"
            />
            <Field
              icon={User} id={ids.nom} label="Nom" required
              type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Diallo"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={ids.telephone} className={LABEL_CLS}>
                Téléphone / WhatsApp <span className="text-error-600" aria-hidden="true">*</span>
              </label>
              <PhoneInputWithCountry
                id={ids.telephone}
                value={telephone}
                onChange={setTelephone}
              />
            </div>
            <Field
              icon={Mail} id={ids.email} label="Email (optionnel)"
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="moussa@gmail.com"
            />
          </div>

          {/* Ville seule sur sa ligne : son placeholder est le plus long du
              formulaire, la caser dans un tiers de colonne la rendait
              illisible. Type + nombre partagent une ligne, deux choix
              courts qui n'ont pas besoin de plus de place.                */}
          <div className="space-y-3">
            <Field
              icon={MapPin} id={ids.ville} label="Ville / zone du bien"
              type="text" value={ville} onChange={(e) => setVille(e.target.value)}
              placeholder="Ex : Almadies, Saly, Mermoz…"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={ids.typeBien} className={LABEL_CLS}>Type de bien</label>
                <select
                  id={ids.typeBien}
                  value={typeBien}
                  onChange={(e) => setTypeBien(e.target.value)}
                  className="w-full rounded-inner border border-border bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-foreground outline-none transition-colors focus:border-forest-600 focus:ring-1 focus:ring-forest-600 [color-scheme:light] cursor-pointer"
                >
                  <option value="Appartement" className="bg-white text-foreground">Appartement</option>
                  <option value="Studio" className="bg-white text-foreground">Studio</option>
                  <option value="Villa" className="bg-white text-foreground">Villa</option>
                  <option value="Chambre" className="bg-white text-foreground">Chambre meublée</option>
                  <option value="Autres" className="bg-white text-foreground">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor={ids.nombreLogements} className={LABEL_CLS}>Nombre de biens</label>
                <input
                  id={ids.nombreLogements}
                  type="text"
                  inputMode="numeric"
                  value={nombreLogements}
                  onChange={(e) => handleNombreLogements(e.target.value)}
                  className="field tabular-nums"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-action w-full">
            <Send className="h-4 w-4" aria-hidden="true" />
            {loading ? 'Envoi…' : 'Confier mon bien à Klef Managed'}
          </button>
        </form>
      )}
    </section>
  );
}