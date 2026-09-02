'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Mail,
  Phone,
  Printer,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';

interface Props {
  ownerId: string;
  ownerName: string;
  isOpen: boolean;
  onClose: () => void;
}

const fcfa = (n?: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

// Générer les 12 derniers mois
function getRecentMonths() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    months.push({
      value,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    });
  }
  return months;
}

export function GestionnaireReleveMensuelModal({ ownerId, ownerName, isOpen, onClose }: Props) {
  const recentMonths = useMemo(() => getRecentMonths(), []);
  const [selectedMonth, setSelectedMonth] = useState(recentMonths[0].value);

  const { data: releve, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['gestionnaire', 'releve-mensuel', ownerId, selectedMonth],
    queryFn: () => nestFetch<any>(NEST_API.GESTIONNAIRE.RELEVE_MENSUEL(ownerId, selectedMonth)),
    enabled: isOpen && !!ownerId,
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!releve) return;

    const phone = releve.proprietaire?.telephone ? releve.proprietaire.telephone.replace(/\s+/g, '') : '';
    const cleanPhone = phone.startsWith('+') ? phone.substring(1) : phone.startsWith('221') ? phone : `221${phone}`;

    const text = `*KLEF MANAGED - RELEVÉ DE GESTION LOCATIVE* 📄
*Période :* ${releve.periode?.label}
*Propriétaire :* ${releve.proprietaire?.nomComplet}

📊 *SYNTHÈSE FINANCIÈRE :*
• *Total Recettes Brutes :* ${fcfa(releve.syntheseFinanciere?.totalEncaissementsBruts)} FCFA
• *Commission Klef Conciergerie :* ${fcfa(releve.syntheseFinanciere?.totalCommissionsKlef)} FCFA
• *Revenu Net Bailleur Généré :* ${fcfa(releve.syntheseFinanciere?.totalNetBailleurGenerer)} FCFA
• *Reversements Mobile Money Effectués :* ${fcfa(releve.syntheseFinanciere?.totalReversementsEffectues)} FCFA
• *Solde Portefeuille Disponible :* ${fcfa(releve.syntheseFinanciere?.soldeActuelWallet)} FCFA

*Nombre de séjours enregistrés :* ${releve.sejours?.length || 0}
*Référence Relevé :* ${releve.referenceReleve}

_Document officiel généré par votre Conciergerie Klef Managed._`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div id="releve-modal-container" className="fixed inset-0 z-[9999] flex items-start justify-center bg-forest-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl border border-border bg-white shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        
        {/* ── 1. BARRE DE COMMANDE SUPÉRIEURE (NON IMPRIMABLE) ───────────────── */}
        <div className="print:hidden border-b border-border bg-forest-950 text-neutral-0 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-neutral-0">
                Relevé Mensuel de Gestion Locative
              </h2>
              <p className="text-xs text-forest-300 font-medium">
                Bailleur Partner : <strong className="text-lime-300">{ownerName}</strong>
              </p>
            </div>
          </div>

          {/* Contrôles & Boutons d'Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sélecteur de mois */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none rounded-pill border border-white/20 bg-forest-900 text-neutral-0 px-4 py-2 pr-9 text-xs font-bold focus:outline-none focus:border-lime-400 cursor-pointer shadow-xs"
              >
                {recentMonths.map((m) => (
                  <option key={m.value} value={m.value} className="bg-forest-950 text-neutral-0">
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-forest-300 pointer-events-none" />
            </div>

            {/* Bouton WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              disabled={!releve}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Bouton Imprimer / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!releve}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-lime-400 hover:bg-lime-500 text-forest-950 text-xs font-extrabold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer / PDF</span>
            </button>

            {/* Fermer */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-pill hover:bg-white/10 text-forest-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Erreur ou Chargement */}
        {isLoading && (
          <div className="p-12 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest-600 border-t-transparent mx-auto" />
            <p className="text-sm font-semibold text-foreground-muted">Génération du relevé certifié en cours...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
            <AlertCircle className="h-10 w-10 text-error-600 mx-auto" />
            <p className="text-sm font-bold text-error-700">Impossible d&apos;extraire les données financières pour ce mois.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-pill bg-forest-900 text-white text-xs font-bold"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ── 2. FEUILLE DE RELEVÉ IMPRIMABLE (OFFICIAL EXECUTIVE PDF TEMPLATE) ── */}
        {!isLoading && !error && releve && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-forest-950 font-sans print:p-0 print:overflow-visible" id="releve-pdf-printable">
            
            {/* ── EN-TÊTE ÉDITORIAL LUXE ───────────────────────────────────── */}
            <div className="border-b-2 border-forest-950 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-black tracking-tight text-forest-950">
                    klef<span className="text-lime-600">.</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider bg-forest-950 text-neutral-0">
                    <Sparkles className="h-2.5 w-2.5 text-lime-400" />
                    Managed Conciergerie
                  </span>
                </div>
                <h1 className="font-display text-xl font-bold text-forest-900 tracking-tight">
                  RELEVÉ MENSUEL DE GESTION LOCATIVE
                </h1>
                <p className="text-xs text-foreground-muted font-medium">
                  Rapport analytique certifié des encaissements et reversements locatifs
                </p>
              </div>

              {/* Cartouche Référence & Période */}
              <div className="rounded-2xl border border-forest-200 bg-forest-50/60 p-4 text-right space-y-1 sm:min-w-[220px]">
                <span className="text-[0.65rem] uppercase font-extrabold tracking-wider text-forest-700 block">
                  RÉFÉRENCE OFFICIELLE
                </span>
                <p className="font-mono text-sm font-black text-forest-950">
                  {releve.referenceReleve}
                </p>
                <div className="pt-1 flex items-center justify-end gap-1.5 text-xs font-bold text-forest-800">
                  <Calendar className="h-3.5 w-3.5 text-forest-600" />
                  <span>{releve.periode?.label}</span>
                </div>
              </div>
            </div>

            {/* ── CARTES BAILLEUR & GESTIONNAIRE ────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Carte Bailleur */}
              <div className="rounded-2xl border border-border bg-neutral-50/50 p-4 space-y-2">
                <span className="text-[0.65rem] uppercase font-extrabold tracking-wider text-foreground-muted block">
                  BAILLEUR PARTENAIRE (PROPRIÉTAIRE)
                </span>
                <p className="font-bold text-sm text-forest-950">{releve.proprietaire?.nomComplet}</p>
                <div className="text-xs space-y-1 text-foreground-muted font-medium">
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-forest-600" />
                    <span>{releve.proprietaire?.telephone}</span>
                  </p>
                  {releve.proprietaire?.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-forest-600" />
                      <span>{releve.proprietaire?.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Carte Conciergerie */}
              <div className="rounded-2xl border border-border bg-neutral-50/50 p-4 space-y-2">
                <span className="text-[0.65rem] uppercase font-extrabold tracking-wider text-foreground-muted block">
                  ORGANISME GESTIONNAIRE
                </span>
                <p className="font-bold text-sm text-forest-950">{releve.gestionnaire?.societe}</p>
                <div className="text-xs space-y-1 text-foreground-muted font-medium">
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-forest-600" />
                    <span>Mandat de gestion conciergerie déléguée</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-forest-600" />
                    <span>{releve.gestionnaire?.contact}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── SYNTHÈSE FINANCIÈRE MENSUELLE (FINANCIAL SUMMARY GRID) ────── */}
            <div className="rounded-2xl border-2 border-forest-950 bg-forest-950 text-neutral-0 p-5 sm:p-6 mb-8 shadow-md">
              <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-lime-300 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Synthèse des Revenus & Reversements ({releve.periode?.label})
                </span>
                <span className="text-[0.65rem] font-bold text-forest-300">
                  Taux Commission Klef : {releve.syntheseFinanciere?.tauxCommissionMoyen}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                {/* 1. Brut Locataire */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[0.65rem] text-forest-300 font-bold uppercase tracking-wider block">
                    1. Encaissements Bruts
                  </span>
                  <p className="font-display text-base sm:text-lg font-bold text-neutral-0 tabular-nums">
                    {fcfa(releve.syntheseFinanciere?.totalEncaissementsBruts)} <span className="text-[0.65rem] font-normal text-forest-300">FCFA</span>
                  </p>
                </div>

                {/* 2. Commission Klef */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[0.65rem] text-forest-300 font-bold uppercase tracking-wider block">
                    2. Commission Conciergerie
                  </span>
                  <p className="font-display text-base sm:text-lg font-bold text-lime-300 tabular-nums">
                    - {fcfa(releve.syntheseFinanciere?.totalCommissionsKlef)} <span className="text-[0.65rem] font-normal text-forest-300">FCFA</span>
                  </p>
                </div>

                {/* 3. Net Généré */}
                <div className="p-3 rounded-xl bg-white/10 border border-lime-400/30 space-y-1">
                  <span className="text-[0.65rem] text-lime-300 font-bold uppercase tracking-wider block">
                    3. Net Bailleur Généré
                  </span>
                  <p className="font-display text-base sm:text-lg font-bold text-neutral-0 tabular-nums">
                    {fcfa(releve.syntheseFinanciere?.totalNetBailleurGenerer)} <span className="text-[0.65rem] font-normal text-lime-300">FCFA</span>
                  </p>
                </div>

                {/* 4. Reversements Effectués */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[0.65rem] text-forest-300 font-bold uppercase tracking-wider block">
                    4. Déjà Versé (Wave/OM)
                  </span>
                  <p className="font-display text-base sm:text-lg font-bold text-neutral-0 tabular-nums">
                    {fcfa(releve.syntheseFinanciere?.totalReversementsEffectues)} <span className="text-[0.65rem] font-normal text-forest-300">FCFA</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── TABLEAU ANALYTIQUE DES SÉJOURS (BOOKINGS DETAIL TABLE) ────── */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-forest-950">
                  Détail des Séjours Encassés ({releve.sejours?.length || 0})
                </h3>
                <span className="text-xs font-semibold text-foreground-muted">
                  Logements gérés : {releve.logements?.map((l: any) => l.titre).join(', ')}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-neutral-100/70 text-[0.65rem] uppercase tracking-wider font-extrabold text-foreground-muted">
                      <th className="p-3">Réf. Séjour</th>
                      <th className="p-3">Logement</th>
                      <th className="p-3">Locataire</th>
                      <th className="p-3">Dates & Nuits</th>
                      <th className="p-3 text-right">Encaissement Brut</th>
                      <th className="p-3 text-right">Commission Klef</th>
                      <th className="p-3 text-right">Net Bailleur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {releve.sejours?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-foreground-muted font-medium italic">
                          Aucun séjour enregistré ou encaissé sur cette période.
                        </td>
                      </tr>
                    ) : (
                      releve.sejours?.map((s: any) => (
                        <tr key={s.id} className="hover:bg-neutral-50/60">
                          <td className="p-3 font-mono font-bold text-forest-900">#{s.code}</td>
                          <td className="p-3 font-semibold text-forest-950 max-w-[180px] truncate">{s.logementTitre}</td>
                          <td className="p-3 font-medium text-foreground">{s.locataireNom}</td>
                          <td className="p-3 font-medium text-foreground-muted">
                            {new Date(s.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            {' → '}
                            {new Date(s.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            <span className="ml-1 text-[0.65rem] font-bold text-forest-700">({s.nuits}n)</span>
                          </td>
                          <td className="p-3 text-right font-semibold tabular-nums text-foreground">{fcfa(s.montantLocataireBrut)} FCFA</td>
                          <td className="p-3 text-right font-medium tabular-nums text-forest-700">- {fcfa(s.commissionKlef)} FCFA</td>
                          <td className="p-3 text-right font-bold tabular-nums text-forest-950">{fcfa(s.netBailleur)} FCFA</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── TABLEAU DES REVERSEMENTS MOBILE MONEY ─────────────────────── */}
            <div className="space-y-3 mb-8">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-forest-950">
                Historique des Reversements Mobile Money (Wave / OM)
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-neutral-100/70 text-[0.65rem] uppercase tracking-wider font-extrabold text-foreground-muted">
                      <th className="p-3">Référence Virement</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Moyen de Paiement</th>
                      <th className="p-3">Numéro Récepteur</th>
                      <th className="p-3 text-right">Montant Versé</th>
                      <th className="p-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {releve.reversementsMobileMoney?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-foreground-muted font-medium italic">
                          Aucun reversement Mobile Money exécuté sur ce mois civil.
                        </td>
                      </tr>
                    ) : (
                      releve.reversementsMobileMoney?.map((w: any) => (
                        <tr key={w.id} className="hover:bg-neutral-50/60">
                          <td className="p-3 font-mono font-bold text-forest-900">#{w.reference}</td>
                          <td className="p-3 font-medium text-foreground-muted">
                            {new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-3 font-semibold">
                            {w.methode === 'ORANGE_MONEY' ? '🍊 Orange Money' : '🌊 Wave Mobile'}
                          </td>
                          <td className="p-3 font-mono text-foreground">{w.telephone}</td>
                          <td className="p-3 text-right font-bold tabular-nums text-forest-950">{fcfa(w.montant)} FCFA</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold bg-success-50 text-success-700 border border-success-500/20">
                              <CheckCircle2 className="h-3 w-3 text-success-600" />
                              Payé
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── PIED DE PAGE & SIGNATURE OFFICIELLE ─────────────────────── */}
            <div className="border-t-2 border-forest-950 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-forest-950 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-lime-600" />
                  <span>Document certifié conforme par le système d&apos;inspection Klef Managed</span>
                </p>
                <p className="text-[0.7rem] text-foreground-muted">
                  Ce relevé vaut justificatif comptable pour le propriétaire partenaire. Pour toute question : concierge@klef.sn
                </p>
              </div>

              <div className="text-right font-mono text-[0.65rem] text-foreground-muted">
                <p>Émis le {new Date().toLocaleDateString('fr-FR')} à Dakar, Sénégal</p>
                <p className="font-bold text-forest-900">Klef Managed · Real Estate Operating Platform</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STYLES CSS SPÉCIFIQUES POUR L'IMPRESSION PDF ───────────────────── */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              background: #ffffff !important;
              color: #041912 !important;
            }
            #releve-modal-container {
              position: static !important;
              background: transparent !important;
              backdrop-filter: none !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: visible !important;
              display: block !important;
            }
            #releve-modal-container > div {
              max-width: 100% !important;
              width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              margin: 0 !important;
            }
            #releve-pdf-printable {
              overflow: visible !important;
              max-height: none !important;
              padding: 0 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
