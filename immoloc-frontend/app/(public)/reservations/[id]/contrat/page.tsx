'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationDetail } from '@/lib/nestjs/types';
import Link from 'next/link';
import {
  ArrowLeft, Printer, Download, Shield, AlertTriangle,
  CheckCircle2, Clock, FileText,
} from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

function dateLong(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function dateTime(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function phonesVisible(dateDebut: string): boolean {
  return (new Date(dateDebut).getTime() - Date.now()) <= 48 * 60 * 60 * 1000;
}

const STATUT_BANNER: Record<string, { label: string; bg: string; border: string; text: string; icon: typeof CheckCircle2 }> = {
  PENDING:    { label: 'En attente de confirmation propriétaire', bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',  icon: Clock },
  PAID:       { label: 'Paiement confirmé — en attente de confirmation', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: Clock },
  CONFIRMED:  { label: 'Contrat actif — réservation confirmée',   bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
  CHECKED_IN: { label: 'Séjour en cours — fonds en séquestre',   bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
  COMPLETED:  { label: 'Séjour terminé — fonds libérés',         bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-600', icon: CheckCircle2 },
  CANCELLED:  { label: 'Contrat annulé',                          bg: 'bg-rose-50',    border: 'border-rose-200',   text: 'text-rose-700',   icon: AlertTriangle },
  DISPUTED:   { label: 'Litige en cours — fonds bloqués',         bg: 'bg-rose-50',    border: 'border-rose-200',   text: 'text-rose-700',   icon: AlertTriangle },
  EXPIRED:    { label: 'Contrat expiré',                          bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-500', icon: Clock },
};

const TYPE_LABEL: Record<string, string> = {
  APPARTEMENT: 'Appartement', STUDIO: 'Studio', VILLA: 'Villa',
  CHAMBRE: 'Chambre', DUPLEX: 'Duplex', PENTHOUSE: 'Penthouse',
};

const ANNULATION_LOCATAIRE = [
  { titre: 'Plus de 7 jours avant', desc: 'Remboursement intégral du locataire, sans pénalité.' },
  { titre: 'Entre 3 et 7 jours avant', desc: 'Remboursement intégral du locataire + pénalité de 20% à la charge du propriétaire.' },
  { titre: 'Moins de 3 jours avant', desc: 'Remboursement intégral du locataire + pénalité de 40% à la charge du propriétaire.' },
];

const ANNULATION_PROPRIO = [
  { titre: 'Plus de 7 jours avant', desc: 'Remboursement intégral au locataire, sans pénalité.' },
  { titre: 'Entre 3 et 7 jours avant', desc: 'Remboursement intégral + pénalité de 20% à la charge du propriétaire.' },
  { titre: 'Moins de 3 jours avant', desc: 'Remboursement intégral + pénalité de 40% à la charge du propriétaire.' },
];

const ARTICLES = [
  {
    num: '3', titre: 'Obligations du propriétaire',
    points: [
      "Mettre à disposition le logement dans l'état décrit, propre et conforme aux photos de l'annonce.",
      "Remettre les clés ou codes d'accès à la date et heure convenues.",
      "Garantir la tranquillité et la sécurité des lieux pendant le séjour.",
      "Fournir les équipements mentionnés dans l'annonce.",
    ],
  },
  {
    num: '4', titre: 'Obligations du locataire',
    points: [
      "Utiliser le logement en bon père de famille et le respecter.",
      "Restituer le logement dans l'état initial à la date et heure convenues.",
      "Signaler immédiatement tout incident, dommage ou problème.",
      "Ne pas sous-louer le logement ni dépasser la capacité déclarée.",
    ],
  },
  {
    num: '8', titre: 'État des lieux',
    desc: "Un état des lieux contradictoire est établi au début et à la fin de la location, accompagné de photos et vidéos. Il fait foi en cas de litige sur l'état du logement.",
  },
  {
    num: '9', titre: 'Dommages et responsabilité',
    desc: 'En cas de dommages, le locataire en informe immédiatement ImmoLoc et le propriétaire. Tout litige est soumis à la médiation ImmoLoc, régi par le droit sénégalais.',
  },
  {
    num: '10', titre: 'Communication et coordination',
    desc: 'Pour la sécurité des utilisateurs, les coordonnées téléphoniques ne sont accessibles que 48 heures avant le début du séjour. Cette mesure assure une communication sécurisée tout en protégeant les données personnelles.',
  },
  {
    num: '11', titre: 'Frais de service',
    desc: 'Les tarifs affichés sur ImmoLoc incluent les frais de service destinés à couvrir le fonctionnement de la plateforme, la sécurisation des transactions via le système de séquestre et la protection des deux parties.',
  },
];

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-neutral-200 rounded-lg" />
      <div className="h-64 bg-neutral-100 rounded-2xl" />
      <div className="h-40 bg-neutral-100 rounded-2xl" />
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TenantContratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: res, isLoading, error } = useQuery<ReservationDetail>({
    queryKey: ['reservation', id],
    queryFn: () => nestFetch<ReservationDetail>(NEST_API.RESERVATIONS.FIND_ONE(id)),
  });

  if (isLoading) return <Skeleton />;

  if (error || !res) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-600 font-medium">Impossible de charger le contrat.</p>
        </div>
      </div>
    );
  }

  const visible = phonesVisible(res.dateDebut);
  const banner = STATUT_BANNER[res.statut] ?? STATUT_BANNER.PENDING;
  const BannerIcon = banner.icon;
  const commissionPct = Math.round(res.tauxCommission * 100);
  const ref = res.id.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 print:px-0 print:py-0 print:pb-0">

      {/* ── Back — masqué à l'impression ── */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href={`/reservations/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la réservation
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Version imprimable
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════
          CONTRAT — fond blanc, print-friendly
          ════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-neutral-200 rounded-2xl print:border-0 print:rounded-none shadow-sm print:shadow-none">

        {/* ── Header ── */}
        <div className="flex items-start justify-between p-6 pb-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">ImmoLoc</p>
              <p className="text-xs font-bold text-neutral-600">Plateforme de location entre particuliers</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${banner.bg} ${banner.border} ${banner.text}`}>
            <BannerIcon className="w-3 h-3" />
            {banner.label.split('—')[0].trim()}
          </span>
        </div>

        <div className="p-6 space-y-7">

          {/* ── Titre + Ref ── */}
          <div>
            <h1 className="text-xl font-black text-neutral-900 tracking-tight">
              Contrat de location de logement
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-500">
              <span>Réf. <strong className="text-neutral-800">{ref}</strong></span>
              <span className="text-neutral-200">·</span>
              <span>Établi le <strong className="text-neutral-800">{dateLong(res.creeLe)}</strong></span>
            </div>
          </div>

          {/* ── Bannière statut ── */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${banner.bg} ${banner.border}`}>
            <BannerIcon className={`w-4 h-4 shrink-0 ${banner.text}`} />
            <p className={`text-sm font-semibold ${banner.text}`}>{banner.label}</p>
          </div>

          {/* ── Parties ── */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { role: 'Locataire', user: res.locataire },
              { role: 'Propriétaire', user: res.proprietaire },
            ].map(({ role, user }) => (
              <div key={role}>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-2">{role}</p>
                <p className="text-sm font-bold text-neutral-900">{user.prenom} {user.nom}</p>
                <p className="text-sm text-neutral-500 font-medium mt-0.5">
                  {visible && user.telephone ? user.telephone : '••••••••'}
                </p>
              </div>
            ))}
          </div>

          {/* ── Détail de la location ── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">Détail de la location</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50">
                  {['Location', 'Logement', 'Prix / nuit', 'Nuits', 'Sous-total'].map((h, i) => (
                    <th key={h} className={`text-left text-[10px] font-black uppercase tracking-wider text-neutral-500 p-3 border border-neutral-100 ${i > 1 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-neutral-100 text-neutral-700 text-xs align-top">
                    Location logement<br />
                    <span className="text-neutral-400">du {dateTime(res.dateDebut)}</span><br />
                    <span className="text-neutral-400">au {dateTime(res.dateFin)}</span>
                  </td>
                  <td className="p-3 border border-neutral-100 text-neutral-700 text-xs align-top">
                    {res.logement.titre}<br />
                    <span className="text-neutral-400">{TYPE_LABEL[res.logement.type]}</span>
                  </td>
                  <td className="p-3 border border-neutral-100 text-right font-semibold text-neutral-900 text-xs">
                    {fcfa(res.prixNuitEffectif)}<br />
                    <span className="text-neutral-400 font-normal">FCFA</span>
                  </td>
                  <td className="p-3 border border-neutral-100 text-right font-semibold text-neutral-900 text-xs">
                    {res.nbNuits}
                  </td>
                  <td className="p-3 border border-neutral-100 text-right font-bold text-neutral-900">
                    {fcfa(res.totalBase)} FCFA
                  </td>
                </tr>
                <tr className="bg-neutral-50">
                  <td colSpan={4} className="p-3 border border-neutral-100 text-right text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    Sous-total
                  </td>
                  <td className="p-3 border border-neutral-100 text-right font-bold text-neutral-900">
                    {fcfa(res.totalBase)} FCFA
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Séquestre (ImmoLoc-specific) ── */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
              <Shield className="w-4 h-4 text-emerald-600" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Séquestre ImmoLoc</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Montant bloqué en séquestre', `${fcfa(res.totalLocataire)} FCFA`],
                  ['Libéré au propriétaire', 'Après validation du check-in par le locataire'],
                  ['Délai de libération', '48h après entrée dans les lieux'],
                  ["En cas de litige", "Fonds bloqués jusqu'à résolution par ImmoLoc"],
                  ['Référence séquestre', `SEQ-${ref}`],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-emerald-100/60 last:border-0">
                    <td className="px-4 py-2.5 text-xs font-semibold text-neutral-600">{label}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-neutral-900 text-right">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Frais de service ── */}
          <div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50">
                  {['Frais de service', 'Taux', 'Montant'].map((h, i) => (
                    <th key={h} className={`text-left text-[10px] font-black uppercase tracking-wider text-neutral-500 p-3 border border-neutral-100 ${i > 0 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-neutral-100 text-xs text-neutral-700">Commission plateforme ImmoLoc</td>
                  <td className="p-3 border border-neutral-100 text-right text-xs font-semibold">{commissionPct}%</td>
                  <td className="p-3 border border-neutral-100 text-right text-xs font-bold text-neutral-900">
                    {fcfa(res.montantCommission)} FCFA
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Total locataire ── */}
          <div>
            <div className="flex items-center justify-between bg-emerald-600 text-white px-4 py-3.5 rounded-xl">
              <p className="text-sm font-black uppercase tracking-wider">Total réglé par vous</p>
              <p className="text-lg font-black">{fcfa(res.totalLocataire)} FCFA</p>
            </div>
          </div>

          {/* ── Politique d'annulation ── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">Politique d'annulation</p>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-black text-neutral-700 uppercase tracking-wider mb-3">Par le locataire</p>
                <div className="space-y-2.5">
                  {ANNULATION_LOCATAIRE.map((item) => (
                    <div key={item.titre}>
                      <p className="text-xs font-bold text-neutral-800">{item.titre} :</p>
                      <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-neutral-700 uppercase tracking-wider mb-3">Par le propriétaire</p>
                <div className="space-y-2.5">
                  {ANNULATION_PROPRIO.map((item) => (
                    <div key={item.titre}>
                      <p className="text-xs font-bold text-neutral-800">{item.titre} :</p>
                      <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Conditions générales ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Conditions générales</p>
              <Link href="/cgu" className="text-[10px] font-bold text-emerald-600 hover:underline">
                Voir les CGU complètes →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {ARTICLES.map((art) => (
                <div key={art.num}>
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                    Art. {art.num} — {art.titre}
                  </p>
                  {art.points ? (
                    <ul className="space-y-1">
                      {art.points.map((p) => (
                        <li key={p} className="flex items-start gap-1.5 text-xs text-neutral-500">
                          <span className="text-neutral-300 mt-0.5 shrink-0">·</span>
                          <span className="leading-relaxed">{p}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-neutral-500 leading-relaxed">{art.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Signatures ── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-5">Signatures</p>
            <div className="grid grid-cols-2 gap-8">
              {[
                { role: 'Le Locataire', user: res.locataire, date: res.creeLe },
                { role: 'Le Propriétaire', user: res.proprietaire, date: res.confirmeeLe ?? res.creeLe },
              ].map(({ role, user, date }) => (
                <div key={role} className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">{role}</p>
                  <p className="text-sm font-bold text-neutral-900">{user.prenom} {user.nom}</p>
                  <p className="text-[10px] text-neutral-400">Lu et approuvé — Bon pour accord</p>
                  <div className="border-t border-neutral-200 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs font-bold text-neutral-700">
                        {user.prenom} {user.nom}
                      </div>
                      <div className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs font-bold text-neutral-700 shrink-0">
                        {dateLong(date)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-neutral-100 pt-5 text-center">
            <p className="text-[10px] text-neutral-400">
              ImmoLoc — Plateforme de location de logements entre particuliers au Sénégal
              {' · '}Réf. {ref}
              {' · '}{dateLong(res.creeLe)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sticky actions — masquées à l'impression ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-neutral-100 px-4 py-3 flex items-center gap-3 print:hidden z-40">
        <div className="max-w-3xl mx-auto w-full flex items-center gap-3">
          {res.contratUrl && (
            <a
              href={res.contratUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" /> Télécharger le PDF
            </a>
          )}
          <Link
            href={`/reservations/${id}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-neutral-700 text-sm font-semibold rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Ma réservation
          </Link>
        </div>
      </div>
    </div>
  );
}
