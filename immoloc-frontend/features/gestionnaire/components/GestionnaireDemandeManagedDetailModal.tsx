'use client';

import { useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  MessageSquareText,
  Phone,
  Send,
  User,
  UserCheck,
  X,
} from 'lucide-react';

export interface LeadItem {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email?: string | null;
  ville?: string | null;
  typeBien?: string | null;
  nombreLogements: number;
  statut: 'NOUVEAU' | 'CONTACTE' | 'CONVERTI' | 'ARCHIVE';
  notesGestionnaire?: string | null;
  proprietaireId?: string | null;
  creeLe: string;
}

interface Props {
  lead: LeadItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, statut: LeadItem['statut'], notes?: string) => Promise<void>;
  onConvertLead: (id: string) => Promise<void>;
}

export function GestionnaireDemandeManagedDetailModal({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  onConvertLead,
}: Props) {
  const [notes, setNotes] = useState(lead?.notesGestionnaire || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [converting, setConverting] = useState(false);

  if (!isOpen || !lead) return null;

  const formattedPhone = lead.telephone.replace(/\s+/g, '');
  const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(
    `Bonjour ${lead.prenom}, je suis le responsable Conciergerie Klef. J'ai bien reçu votre demande pour votre bien à ${
      lead.ville || 'Dakar'
    }. Quand seriez-vous disponible pour échanger ?`,
  )}`;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await onUpdateStatus(lead.id, lead.statut, notes);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      await onConvertLead(lead.id);
      onClose();
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl rounded-card border shadow-xl bg-background-card overflow-hidden my-8 space-y-6"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="p-6 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--neutral-50)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-card flex items-center justify-center shrink-0 shadow-xs"
              style={{ background: 'var(--forest-900)', color: 'var(--lime-400)' }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold" style={{ color: 'var(--forest-950)' }}>
                Fiche Prospect Klef Managed
              </h3>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                Reçue le {new Date(lead.creeLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-pill border transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
          >
            <X className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
          </button>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="px-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Identity & Contact Card */}
          <div
            className="p-5 rounded-inner border space-y-4"
            style={{ background: 'var(--background-alt)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shadow-xs"
                  style={{ background: 'var(--forest-900)', color: 'var(--lime-400)' }}
                >
                  {lead.prenom[0]}
                  {lead.nom[0]}
                </div>
                <div>
                  <h4 className="font-display text-base font-bold" style={{ color: 'var(--forest-950)' }}>
                    {lead.prenom} {lead.nom}
                  </h4>
                  <p className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
                    Prospect Bailleur
                  </p>
                </div>
              </div>

              {/* Quick Actions (Call & WhatsApp) */}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${lead.telephone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-xs font-bold border transition-colors"
                  style={{
                    background: 'var(--background-card)',
                    color: 'var(--forest-900)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <Phone className="w-3.5 h-3.5 text-forest-600" />
                  <span>Appeler</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-xs font-bold transition-all shadow-2xs"
                  style={{
                    background: '#25D366',
                    color: 'white',
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider block" style={{ color: 'var(--foreground-muted)' }}>
                  Téléphone
                </span>
                <span className="text-xs font-bold" style={{ color: 'var(--forest-950)' }}>
                  {lead.telephone}
                </span>
              </div>

              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider block" style={{ color: 'var(--foreground-muted)' }}>
                  Email
                </span>
                <span className="text-xs font-bold truncate block" style={{ color: 'var(--forest-950)' }}>
                  {lead.email || 'Non renseigné'}
                </span>
              </div>

              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider block" style={{ color: 'var(--foreground-muted)' }}>
                  Zone &amp; Biens
                </span>
                <span className="text-xs font-bold" style={{ color: 'var(--forest-950)' }}>
                  {lead.ville || 'Dakar'} · {lead.nombreLogements} bien{lead.nombreLogements > 1 ? 's' : ''} ({lead.typeBien || 'Appartement'})
                </span>
              </div>
            </div>
          </div>

          {/* Status Switcher & Actions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold" style={{ color: 'var(--forest-900)' }}>
              Statut de la demande
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'NOUVEAU', label: '⚡ Nouveau' },
                { id: 'CONTACTE', label: '📞 Contacté' },
                { id: 'CONVERTI', label: '✓ Converti' },
                { id: 'ARCHIVE', label: '📂 Archivé' },
              ].map((st) => {
                const isActive = lead.statut === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onUpdateStatus(lead.id, st.id as LeadItem['statut'])}
                    className="px-3 py-2 rounded-pill text-xs font-bold border transition-all cursor-pointer text-center"
                    style={{
                      background: isActive ? 'var(--forest-900)' : 'var(--background-card)',
                      color: isActive ? 'var(--lime-400)' : 'var(--foreground-muted)',
                      borderColor: isActive ? 'var(--forest-700)' : 'var(--border)',
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manager Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold" style={{ color: 'var(--forest-900)' }}>
              Notes internes de la Conciergerie
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Rédigez ici vos notes de suivi (ex: 'Rendez-vous fixé jeudi 14h aux Almadies pour photos')..."
              className="w-full rounded-inner border p-3 text-xs font-medium outline-none transition-colors bg-white [color-scheme:light]"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-1.5 rounded-pill text-xs font-bold border transition-colors cursor-pointer"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--background-card)',
                  color: 'var(--forest-900)',
                }}
              >
                {savingNotes ? 'Enregistrement…' : 'Sauvegarder la note'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div
          className="p-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ borderColor: 'var(--border)', background: 'var(--neutral-50)' }}
        >
          {lead.statut === 'CONVERTI' ? (
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--success-700)' }}>
              <CheckCircle2 className="w-4 h-4 text-success-600" />
              <span>Prospect converti en Bailleur Partenaire sous mandat</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting}
              className="btn-action inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-forest-950" />
              <span>{converting ? 'Conversion...' : 'Convertir en Bailleur Partenaire'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-pill text-xs font-bold border cursor-pointer"
            style={{ borderColor: 'var(--border)', background: 'var(--background-card)', color: 'var(--foreground)' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
