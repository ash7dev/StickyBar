'use client';

import { useState } from 'react';
import { Check, CreditCard, Landmark, Loader2, Save, Smartphone, Wallet } from 'lucide-react';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';

export function GestionnaireParametresCoordonneesVirement() {
  const [methodePreferee, setMethodePreferee] = useState<'WAVE' | 'ORANGE_MONEY' | 'BANQUE'>('WAVE');
  const [telephoneMobileMoney, setTelephoneMobileMoney] = useState('+221 77 845 12 34');
  const [nomTitulaire, setNomTitulaire] = useState('Ashs Thiam (Conciergerie)');
  const [nomBanque, setNomBanque] = useState('CBAO Groupe Attijariwafa Bank');
  const [iban, setIban] = useState('SN08 0100 1234 5678 9012 3456 78');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }, 600);
  };

  return (
    <div
      className="rounded-card border shadow-2xs p-6 sm:p-7 space-y-6"
      style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
    >
      {/* ── Titre ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
            style={{ background: 'var(--gold-50)' }}
          >
            <Wallet className="w-5 h-5" style={{ color: 'var(--gold-700)' }} />
          </div>
          <div>
            <h2
              className="font-display text-lg font-bold tracking-tight"
              style={{ color: 'var(--forest-900)' }}
            >
              Comptes de Réception &amp; Virement
            </h2>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
              Coordonnées pour percevoir les commissions de conciergerie et restitutions.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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
            <span>Coordonnées de virement mises à jour avec succès !</span>
          </div>
        )}

        {/* Sélection du canal de réception */}
        <div className="space-y-3">
          <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
            Canal de paiement privilégié
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'WAVE', label: 'Wave Sénégal', sub: 'Paiement instantané (0% frais)', icon: Smartphone },
              { id: 'ORANGE_MONEY', label: 'Orange Money', sub: 'Mobile Money Sénégal', icon: Smartphone },
              { id: 'BANQUE', label: 'Virement Bancaire', sub: 'RIB / IBAN UEMOA', icon: Landmark },
            ].map((item) => {
              const IconComponent = item.icon;
              const active = methodePreferee === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMethodePreferee(item.id as any)}
                  className="flex flex-col text-left p-4 rounded-card border transition-all cursor-pointer space-y-1.5"
                  style={{
                    background: active ? 'var(--forest-50)' : 'var(--background-card)',
                    borderColor: active ? 'var(--forest-500)' : 'var(--border)',
                    boxShadow: active ? '0 0 0 1px var(--forest-500)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <IconComponent
                      className="w-5 h-5"
                      style={{ color: active ? 'var(--forest-700)' : 'var(--foreground-muted)' }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border flex items-center justify-center"
                      style={{
                        borderColor: active ? 'var(--forest-600)' : 'var(--border)',
                        background: active ? 'var(--forest-600)' : 'transparent',
                      }}
                    >
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p
                    className="text-xs font-bold"
                    style={{ color: active ? 'var(--forest-950)' : 'var(--foreground)' }}
                  >
                    {item.label}
                  </p>
                  <p className="text-[0.65rem] font-medium" style={{ color: 'var(--foreground-muted)' }}>
                    {item.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Détails du mode choisi */}
        {(methodePreferee === 'WAVE' || methodePreferee === 'ORANGE_MONEY') && (
          <div className="space-y-4 p-4 rounded-inner" style={{ background: 'var(--background-alt)', border: '1px solid var(--border)' }}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
                Numéro de téléphone {methodePreferee === 'WAVE' ? 'Wave' : 'Orange Money'}
              </label>
              <PhoneInputWithCountry
                value={telephoneMobileMoney}
                onChange={setTelephoneMobileMoney}
              />
              <p className="text-[0.65rem] font-medium" style={{ color: 'var(--foreground-muted)' }}>
                Assurez-vous que le compte Mobile Money est actif et identifié à votre nom.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
                Nom du Titulaire
              </label>
              <input
                type="text"
                value={nomTitulaire}
                onChange={(e) => setNomTitulaire(e.target.value)}
                placeholder="Nom complet du titulaire"
                required
                className="w-full rounded-pill border px-4 py-2.5 text-xs font-medium outline-none bg-white [color-scheme:light]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>
        )}

        {methodePreferee === 'BANQUE' && (
          <div className="space-y-4 p-4 rounded-inner" style={{ background: 'var(--background-alt)', border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
                  Établissement Bancaire
                </label>
                <input
                  type="text"
                  value={nomBanque}
                  onChange={(e) => setNomBanque(e.target.value)}
                  placeholder="ex: CBAO / BOA / Ecobank"
                  required
                  className="w-full rounded-pill border px-4 py-2.5 text-xs font-medium outline-none bg-white [color-scheme:light]"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
                  Titulaire du Compte
                </label>
                <input
                  type="text"
                  value={nomTitulaire}
                  onChange={(e) => setNomTitulaire(e.target.value)}
                  placeholder="Nom exact sur le RIB"
                  required
                  className="w-full rounded-pill border px-4 py-2.5 text-xs font-medium outline-none bg-white [color-scheme:light]"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
                  Numéro IBAN / RIB (Zone UEMOA)
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="SN08 0100 1234 5678 9012 3456 78"
                  required
                  className="w-full font-mono rounded-pill border px-4 py-2.5 text-xs font-bold tracking-wider outline-none bg-white [color-scheme:light]"
                  style={{ borderColor: 'var(--border)', color: 'var(--forest-950)' }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
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
                <span>Enregistrer le compte de virement</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
