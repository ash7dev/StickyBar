'use client';

import { useState } from 'react';
import { Users, Wallet, CheckCircle2, AlertCircle, Phone, Mail } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { cn } from '@/lib/utils/cn';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

interface Owner {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  logementsCount: number;
  soldeDisponible: number;
}

interface Props {
  owners: Owner[];
  onRefresh?: () => void;
}

export function GestionnaireProprietairesOverview({ owners, onRefresh }: Props) {
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState<'WAVE' | 'ORANGE_MONEY'>('WAVE');
  const [telephonePay, setTelephonePay] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openModal = (owner: Owner) => {
    setSelectedOwner(owner);
    setTelephonePay(owner.telephone || '');
    setMontant(owner.soldeDisponible > 0 ? String(owner.soldeDisponible) : '');
    setFeedback(null);
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      await nestFetch(`/api/v1/gestionnaire/proprietaires/${selectedOwner.id}/retrait`, {
        method: 'POST',
        body: JSON.stringify({
          montant: Number(montant),
          methode,
          telephoneMobileMoney: telephonePay,
        }),
      });

      setFeedback({
        type: 'success',
        message: `Demande de reversement de ${fcfa(Number(montant))} FCFA envoyée avec succès pour ${selectedOwner.prenom} ${selectedOwner.nom}.`,
      });
      onRefresh?.();
      setTimeout(() => setSelectedOwner(null), 2000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Impossible d’initier le reversement. Vérifiez le solde du propriétaire.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-card border border-border bg-background-card p-7 sm:p-8 shadow-2xs space-y-6 min-h-[320px] flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2.5">
              <Users className="h-6 w-6 text-forest-600" aria-hidden="true" />
              <span>Portefeuille des Propriétaires & Reversements</span>
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
              Gérez les soldes disponibles et initiez les virements Wave / Orange Money vers vos partenaires
            </p>
          </div>

          <span className="inline-flex items-center rounded-pill bg-forest-50 text-forest-700 border border-forest-200/60 px-3.5 py-1.5 text-xs font-semibold self-start sm:self-auto">
            {owners.length} propriétaire{owners.length > 1 ? 's' : ''} sous contrat
          </span>
        </div>

        {owners.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="grid h-14 w-14 place-items-center rounded-inner bg-forest-50 text-forest-700 mx-auto">
              <Users className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-foreground">Aucun propriétaire partenaire enregistré</p>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
              Le suivi des portefeuilles et le déclenchement des versements Mobile Money (Wave / Orange Money) s&apos;activeront dès le rattachement de vos premiers propriétaires partenaires.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-foreground-muted uppercase tracking-wider text-[0.6875rem]">
                  <th className="py-4.5 px-5 font-semibold">Propriétaire</th>
                  <th className="py-4.5 px-5 font-semibold">Contact</th>
                  <th className="py-4.5 px-5 font-semibold text-center">Logements gérés</th>
                  <th className="py-4.5 px-5 font-semibold text-right">Solde disponible</th>
                  <th className="py-4.5 px-5 font-semibold text-right">Action Reversement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-5 px-5">
                      <div className="flex items-center gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-forest-900 text-lime-400 font-bold text-sm shadow-xs">
                          {owner.prenom[0]}{owner.nom[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{owner.prenom} {owner.nom}</p>
                          <span className="inline-flex items-center text-xs text-forest-700 font-medium">
                            Mandat Conciergerie Actif
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-5 px-5 text-foreground-muted">
                      <div className="space-y-1 font-medium text-xs sm:text-sm">
                        <p className="flex items-center gap-2 text-foreground font-medium">
                          <Phone className="h-4 w-4 text-forest-600" aria-hidden="true" /> {owner.telephone}
                        </p>
                        {owner.email && (
                          <p className="flex items-center gap-2 text-foreground-muted truncate max-w-[200px]">
                            <Mail className="h-4 w-4 text-foreground-faint" aria-hidden="true" /> {owner.email}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-5 px-5 text-center">
                      <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-pill text-xs font-semibold bg-neutral-100 text-foreground">
                        {owner.logementsCount} bien{owner.logementsCount > 1 ? 's' : ''}
                      </span>
                    </td>

                    <td className="py-5 px-5 text-right">
                      <span className="font-display text-lg font-semibold text-forest-950 tabular-nums">
                        {fcfa(owner.soldeDisponible)} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
                      </span>
                    </td>

                    <td className="py-5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(owner)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-button-primary hover:bg-button-primary-hover text-on-button-primary text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer border-none"
                      >
                        <Wallet className="h-4 w-4" aria-hidden="true" />
                        <span>Reversement</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de demande de reversement */}
      {selectedOwner && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-card border border-border bg-background-card p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">
                Reversement conciergerie pour {selectedOwner.prenom} {selectedOwner.nom}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOwner(null)}
                className="text-xs font-bold text-foreground-muted hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-inner bg-forest-50 border border-forest-200 text-xs sm:text-sm text-forest-900 flex items-center justify-between font-medium">
              <span>Solde actuellement disponible :</span>
              <span className="font-bold tabular-nums">{fcfa(selectedOwner.soldeDisponible)} FCFA</span>
            </div>

            {feedback && (
              <div
                className={cn(
                  'p-3.5 rounded-inner text-xs flex items-center gap-2 font-medium',
                  feedback.type === 'success' ? 'bg-success-50 text-success-700 border border-success-500/20' : 'bg-error-50 text-error-700 border border-error-500/20',
                )}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawal} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-foreground mb-1.5">Montant à reverser (FCFA)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={selectedOwner.soldeDisponible}
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Ex: 150000"
                  className="w-full rounded-field border border-border bg-background-card p-3 text-sm font-semibold text-foreground focus:border-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1.5">Moyen de paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['WAVE', 'ORANGE_MONEY'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethode(m)}
                      className={cn(
                        'p-3 rounded-pill border text-xs font-semibold transition-all duration-150 cursor-pointer text-center',
                        methode === m ? 'border-forest-700 bg-forest-900 text-neutral-0 shadow-xs' : 'border-border bg-background-alt text-foreground hover:bg-neutral-100',
                      )}
                    >
                      {m === 'WAVE' ? '🌊 Wave' : '🍊 Orange Money'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1.5">Numéro Mobile Money du propriétaire</label>
                <input
                  type="text"
                  required
                  value={telephonePay}
                  onChange={(e) => setTelephonePay(e.target.value)}
                  placeholder="+221 77 XXX XX XX"
                  className="w-full rounded-field border border-border bg-background-card p-3 text-sm text-foreground focus:border-forest-600 focus:outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedOwner(null)}
                  className="px-4.5 py-2.5 rounded-pill border border-border text-xs font-semibold text-foreground hover:bg-background-alt"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-action px-5 py-2.5 text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Traitement...' : 'Confirmer le virement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
