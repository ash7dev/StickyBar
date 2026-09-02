'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowUpRight, Check, Wallet, X } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { fcfa } from '@/lib/dashboard/owner-tokens';

interface OwnerItem {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  soldeDisponible: number;
}

interface Props {
  owner: OwnerItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GestionnaireDemandeVirementModal({ owner, isOpen, onClose }: Props) {
  const [montant, setMontant] = useState<string>(owner ? String(owner.soldeDisponible) : '');
  const [methode, setMethode] = useState<'WAVE' | 'ORANGE_MONEY' | 'VIREMENT_BANCAIRE'>('WAVE');
  const [telephoneBeneficiaire, setTelephoneBeneficiaire] = useState(owner?.telephone || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const withdrawMutation = useMutation({
    mutationFn: (data: { montant: number; methode: string; telephone: string }) =>
      nestFetch(NEST_API.WALLET.WITHDRAW, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestionnaire', 'dashboard'] });
      onClose();
    },
    onError: (e) => {
      setErrorMsg(e instanceof Error ? e.message : 'La demande de virement n’a pas pu être envoyée.');
    },
  });

  if (!isOpen || !owner) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(montant);
    if (!val || val <= 0) {
      setErrorMsg('Veuillez entrer un montant valide supérieur à 0 FCFA.');
      return;
    }
    if (val > owner.soldeDisponible) {
      setErrorMsg(`Le montant du virement ne peut pas dépasser le solde disponible (${fcfa(owner.soldeDisponible)} FCFA).`);
      return;
    }
    if (!telephoneBeneficiaire.trim()) {
      setErrorMsg('Veuillez renseigner le numéro de téléphone ou de compte bénéficiaire.');
      return;
    }
    setErrorMsg(null);
    withdrawMutation.mutate({
      montant: val,
      methode,
      telephone: telephoneBeneficiaire,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-card border border-border bg-white p-6 sm:p-7 shadow-2xl shadow-forest-950/15 space-y-5 animate-in zoom-in-95 duration-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── En-tête de la Modale ──────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-pill bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-forest-900 tracking-tight">
                Virement Conciergerie / Bailleur
              </h3>
              <p className="text-xs text-foreground-muted font-medium mt-0.5">
                Disposer des fonds sur le compte de {owner.prenom} {owner.nom}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-pill hover:bg-neutral-100 text-foreground-muted transition-colors cursor-pointer"
            aria-label="Fermer la fenêtre"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Message d'erreur */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-card border border-error-500/20 bg-error-50 p-3.5 text-xs text-error-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-error-600" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Carte Information Solde */}
        <div className="p-4 rounded-inner bg-forest-50 border border-forest-200/80 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[0.6875rem] font-bold text-forest-700 uppercase tracking-wider">Solde Wallet Disponible</span>
            <p className="font-display text-xl font-extrabold text-forest-900 tabular-nums mt-0.5">
              {fcfa(owner.soldeDisponible)} FCFA
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMontant(String(owner.soldeDisponible))}
            className="px-3.5 py-1.5 rounded-pill bg-white border border-forest-200/80 text-xs font-bold text-forest-800 hover:bg-forest-100 transition-colors cursor-pointer shadow-2xs"
          >
            Tout verser
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Montant */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Montant du virement (FCFA) *</label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex: 150000"
              className="w-full rounded-pill border border-border bg-white text-neutral-900 px-4 py-3 font-semibold text-sm focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/10 shadow-2xs"
            />
          </div>

          {/* Méthode de virement (SANS EMOJI & SANS FREE) */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Méthode de virement *</label>
            <select
              value={methode}
              onChange={(e) => setMethode(e.target.value as any)}
              className="w-full rounded-pill border border-border bg-white text-neutral-900 px-4 py-3 font-semibold focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/10 cursor-pointer shadow-2xs [color-scheme:light]"
            >
              <option value="WAVE" className="bg-white text-neutral-900 py-1">Wave Sénégal</option>
              <option value="ORANGE_MONEY" className="bg-white text-neutral-900 py-1">Orange Money Sénégal</option>
              <option value="VIREMENT_BANCAIRE" className="bg-white text-neutral-900 py-1">Virement Bancaire (RIB / IBAN)</option>
            </select>
          </div>

          {/* Numéro téléphone / Compte */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Numéro téléphone / IBAN bénéficiaire *</label>
            <input
              type="text"
              value={telephoneBeneficiaire}
              onChange={(e) => setTelephoneBeneficiaire(e.target.value)}
              placeholder="+221 77 000 00 00"
              className="w-full rounded-pill border border-border bg-white text-neutral-900 px-4 py-3 font-semibold focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/10 shadow-2xs"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-pill border border-border bg-white hover:bg-neutral-100 text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="btn-action inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-forest-950 disabled:opacity-50 border-none cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-forest-950" aria-hidden="true" />
              <span>{withdrawMutation.isPending ? 'Enregistrement...' : 'Exécuter le virement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
