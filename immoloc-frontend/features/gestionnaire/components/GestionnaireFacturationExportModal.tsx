'use client';

import { useState } from 'react';
import { Download, FileText, Printer, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proprietaires: Array<{ id: string; prenom: string; nom: string; soldeDisponible: number }>;
}

export function GestionnaireFacturationExportModal({ isOpen, onClose, proprietaires }: Props) {
  const [selectedOwnerId, setSelectedOwnerId] = useState(proprietaires[0]?.id || '');
  const [selectedMois, setSelectedMois] = useState('2026-09');

  if (!isOpen) return null;

  const currentOwner = proprietaires.find((p) => p.id === selectedOwnerId) || proprietaires[0];
  const fcfa = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n || 0));

  // Simulation calculs décompte
  const totalGeneres = currentOwner ? (currentOwner.soldeDisponible * 1.15 || 450000) : 0;
  const commissionConciergerie = Math.round(totalGeneres * 0.07);
  const netBailleur = totalGeneres - commissionConciergerie;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-card border border-border bg-white p-6 sm:p-8 shadow-2xl shadow-forest-950/15 space-y-6 animate-in zoom-in-95 duration-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-pill bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-forest-900 tracking-tight">
                Fiche de Décompte & Reversement Bailleur
              </h3>
              <p className="text-xs text-foreground-muted font-medium mt-0.5">
                Relevé mensuel des revenus locatifs et commissions de conciergerie.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-pill hover:bg-neutral-100 text-foreground-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Formulaire sélection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Bailleur Partenaire *</label>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="w-full rounded-pill border border-border bg-white text-neutral-900 px-4 py-2.5 font-semibold focus:outline-none focus:border-forest-600 shadow-2xs cursor-pointer [color-scheme:light]"
            >
              {proprietaires.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-neutral-900">
                  {p.prenom} {p.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Période du Décompte *</label>
            <select
              value={selectedMois}
              onChange={(e) => setSelectedMois(e.target.value)}
              className="w-full rounded-pill border border-border bg-white text-neutral-900 px-4 py-2.5 font-semibold focus:outline-none focus:border-forest-600 shadow-2xs cursor-pointer [color-scheme:light]"
            >
              <option value="2026-09" className="bg-white text-neutral-900">Septembre 2026</option>
              <option value="2026-08" className="bg-white text-neutral-900">Août 2026</option>
              <option value="2026-07" className="bg-white text-neutral-900">Juillet 2026</option>
            </select>
          </div>
        </div>

        {/* Aperçu de la fiche de décompte */}
        {currentOwner && (
          <div className="border border-border rounded-card bg-neutral-50/70 p-5 space-y-4 text-xs print:p-0 print:bg-white print:border-none">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="font-display font-bold text-forest-900 text-sm">
                  RELEVÉ DE COMPTE CONCIERGERIE · KLEF
                </p>
                <p className="text-[0.6875rem] text-foreground-muted">Période : {selectedMois}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{currentOwner.prenom} {currentOwner.nom}</p>
                <p className="text-[0.6875rem] text-foreground-muted">Bailleur Partenaire</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-foreground-muted font-medium">Revenus locatifs bruts générés</span>
                <span className="font-bold text-foreground tabular-nums">{fcfa(totalGeneres)} FCFA</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40 text-gold-800">
                <span className="font-medium">Commission de gestion conciergerie (7%)</span>
                <span className="font-bold tabular-nums">- {fcfa(commissionConciergerie)} FCFA</span>
              </div>
              <div className="flex justify-between py-2 pt-3 font-extrabold text-sm text-forest-900">
                <span>Net Total à Reverser au Bailleur</span>
                <span className="text-base text-success-700 tabular-nums">{fcfa(netBailleur)} FCFA</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-pill border border-border bg-white hover:bg-neutral-100 text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-pill border border-border bg-white hover:bg-neutral-100 text-xs font-bold text-foreground transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-forest-600" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
