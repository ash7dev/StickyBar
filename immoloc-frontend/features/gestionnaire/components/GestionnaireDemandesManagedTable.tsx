'use client';

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Inbox,
  MapPin,
  MessageSquare,
  Phone,
  UserCheck,
} from 'lucide-react';
import { type LeadItem } from './GestionnaireDemandeManagedDetailModal';
import { cn } from '@/lib/utils/cn';

interface Props {
  leads: LeadItem[];
  onOpenDetail: (lead: LeadItem) => void;
  onUpdateStatus: (id: string, statut: LeadItem['statut']) => Promise<void>;
  onConvertLead: (id: string) => Promise<void>;
}

export function GestionnaireDemandesManagedTable({
  leads,
  onOpenDetail,
  onUpdateStatus,
  onConvertLead,
}: Props) {
  return (
    <div
      className="rounded-card border shadow-2xs overflow-hidden"
      style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs min-w-[860px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--neutral-50)' }}>
              {['Prospect', 'Contact & WhatsApp', 'Bien & Zone', 'Date Demande', 'Statut', 'Actions'].map(
                (h, i) => (
                  <th
                    key={h}
                    className={cn('px-5 py-3.5 text-[0.65rem] font-bold uppercase tracking-wider', i === 5 && 'text-right')}
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--neutral-100)' }}
                    >
                      <Inbox className="w-6 h-6" style={{ color: 'var(--neutral-400)' }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
                      Aucune demande Klef Managed trouvée pour ce filtre
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--foreground-faint)' }}>
                      Les demandes d'accompagnement soumises par les propriétaires s'afficheront ici.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((l) => {
                const formattedPhone = l.telephone.replace(/\s+/g, '');
                const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(
                  `Bonjour ${l.prenom}, je suis le responsable Conciergerie Klef. J'ai bien reçu votre demande de gestion pour votre bien à ${
                    l.ville || 'Dakar'
                  }. Quand êtes-vous disponible pour échanger ?`,
                )}`;

                return (
                  <tr
                    key={l.id}
                    className="transition-colors cursor-pointer"
                    onClick={() => onOpenDetail(l)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Prospect Name & Avatar */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                          style={{ background: 'var(--forest-900)', color: 'var(--lime-400)' }}
                        >
                          {l.prenom[0]}
                          {l.nom[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate max-w-[180px]" style={{ color: 'var(--forest-950)' }}>
                            {l.prenom} {l.nom}
                          </p>
                          {l.email && (
                            <p className="text-[0.65rem] font-medium truncate max-w-[180px]" style={{ color: 'var(--foreground-muted)' }}>
                              {l.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact & WhatsApp */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${l.telephone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[0.65rem] font-bold border transition-colors hover:bg-neutral-100"
                          style={{
                            borderColor: 'var(--border)',
                            color: 'var(--forest-900)',
                            background: 'var(--background-card)',
                          }}
                        >
                          <Phone className="w-3 h-3 text-forest-600" />
                          <span>{l.telephone}</span>
                        </a>

                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[0.65rem] font-bold text-white transition-transform hover:scale-105 shadow-2xs"
                          style={{ background: '#25D366' }}
                          title="Ouvrir la discussion WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 fill-white" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </td>

                    {/* Bien & Zone */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--forest-950)' }}>
                        <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                        <span>{l.ville || 'Dakar'}</span>
                      </div>
                      <p className="text-[0.65rem] font-medium mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                        {l.nombreLogements} bien{l.nombreLogements > 1 ? 's' : ''} ({l.typeBien || 'Appartement'})
                      </p>
                    </td>

                    {/* Date Demande */}
                    <td className="px-5 py-4">
                      <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                        {new Date(l.creeLe).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>

                    {/* Statut */}
                    <td className="px-5 py-4">
                      <LeadStatusTag statut={l.statut} />
                    </td>

                    {/* Actions (Convert & View) */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {l.statut !== 'CONVERTI' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onConvertLead(l.id);
                            }}
                            className="btn-action inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-[0.65rem] font-bold cursor-pointer"
                            title="Créer un compte bailleur partenaire à partir de ce prospect"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-forest-950" />
                            <span>Convertir</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(l);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-bold transition-colors cursor-pointer"
                          style={{
                            background: 'var(--forest-50)',
                            color: 'var(--forest-800)',
                            border: '1px solid var(--forest-200)',
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Détail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Status Tag Sub-component */
function LeadStatusTag({ statut }: { statut: LeadItem['statut'] }) {
  if (statut === 'NOUVEAU') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[0.65rem] font-bold"
        style={{
          background: 'var(--warning-50)',
          color: 'var(--warning-700)',
          border: '1px solid var(--warning-500)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        ⚡ Nouveau
      </span>
    );
  }

  if (statut === 'CONTACTE') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[0.65rem] font-bold"
        style={{
          background: 'var(--gold-50)',
          color: 'var(--gold-800)',
          border: '1px solid var(--gold-200)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        📞 En cours
      </span>
    );
  }

  if (statut === 'CONVERTI') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[0.65rem] font-bold"
        style={{
          background: 'var(--success-50)',
          color: 'var(--success-700)',
          border: '1px solid var(--success-500)',
        }}
      >
        <CheckCircle2 className="w-3 h-3 text-success-600" />
        ✓ Bailleur Partner
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[0.65rem] font-medium"
      style={{
        background: 'var(--neutral-100)',
        color: 'var(--neutral-700)',
        border: '1px solid var(--border)',
      }}
    >
      📂 Archivé
    </span>
  );
}
