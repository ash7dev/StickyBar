'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  FileText,
  MessageSquare,
  PhoneCall,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NotificationOption {
  id: string;
  title: string;
  description: string;
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'PUSH' | 'URGENT';
  channelLabel: string;
  icon: any;
  state: boolean;
  setter: (val: boolean) => void;
}

export function GestionnaireParametresNotifications() {
  const [notifySmsReservation, setNotifySmsReservation] = useState(true);
  const [notifyWhatsappCheckin, setNotifyWhatsappCheckin] = useState(true);
  const [notifyPayoutRequest, setNotifyPayoutRequest] = useState(true);
  const [autoMonthlyStatement, setAutoMonthlyStatement] = useState(true);
  const [notifyDisputes, setNotifyDisputes] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (current: boolean, setter: (v: boolean) => void) => {
    setter(!current);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const options: NotificationOption[] = [
    {
      id: 'sms_reservation',
      title: 'Alerte SMS immédiate aux nouvelles réservations',
      description: 'Recevez un SMS instantané dès qu’un voyageur confirme une réservation payée sur un bien géré.',
      channel: 'SMS',
      channelLabel: 'SMS Pro Instantané',
      icon: PhoneCall,
      state: notifySmsReservation,
      setter: setNotifySmsReservation,
    },
    {
      id: 'whatsapp_checkin',
      title: 'Notification WhatsApp 24h avant Check-in / Check-out',
      description: 'Envoi automatique au voyageur des instructions d’arrivée, du code digicode et du contact concierge.',
      channel: 'WHATSAPP',
      channelLabel: 'WhatsApp Business',
      icon: MessageSquare,
      state: notifyWhatsappCheckin,
      setter: setNotifyWhatsappCheckin,
    },
    {
      id: 'payout_request',
      title: 'Demandes de reversement des bailleurs partenaires',
      description: 'Alerte lors d’une demande de versement effectuée par un propriétaire partenaire sous mandat.',
      channel: 'PUSH',
      channelLabel: 'Notification Portail',
      icon: Bell,
      state: notifyPayoutRequest,
      setter: setNotifyPayoutRequest,
    },
    {
      id: 'auto_monthly_statement',
      title: 'Relevé financier mensuel automatique par email',
      description: 'Envoi du bilan comptable, du décompte des commissions et des états de versement le 1er de chaque mois.',
      channel: 'EMAIL',
      channelLabel: 'Email Automatique PDF',
      icon: FileText,
      state: autoMonthlyStatement,
      setter: setAutoMonthlyStatement,
    },
    {
      id: 'disputes_alert',
      title: 'Alertes prioritaires de litiges & états des lieux',
      description: 'Alerte immédiate en cas de signalement de dégât ou de litige survenu lors du check-out.',
      channel: 'URGENT',
      channelLabel: 'Alerte Prioritaire',
      icon: ShieldAlert,
      state: notifyDisputes,
      setter: setNotifyDisputes,
    },
  ];

  const activeCount = options.filter((o) => o.state).length;

  return (
    <div
      className="rounded-card border shadow-2xs overflow-hidden space-y-6 p-6 sm:p-7"
      style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
    >
      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
            style={{ background: 'var(--forest-50)' }}
          >
            <Bell className="w-5 h-5" style={{ color: 'var(--forest-700)' }} />
          </div>
          <div>
            <h2
              className="font-display text-lg font-bold tracking-tight"
              style={{ color: 'var(--forest-900)' }}
            >
              Alertes &amp; Notifications Opérationnelles
            </h2>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
              Canaux de communication pour la gestion instantanée des réservations et check-ins.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-bold"
            style={{
              background: 'var(--forest-50)',
              color: 'var(--forest-800)',
              border: '1px solid var(--forest-200)',
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {activeCount} sur {options.length} alertes actives
          </span>
        </div>
      </div>

      {/* Message Feedback */}
      {savedSuccess && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-inner text-xs font-bold transition-all"
          style={{
            background: 'var(--success-50)',
            color: 'var(--success-700)',
            border: '1px solid var(--success-500)',
          }}
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>Préférences d'alerte enregistrées instantanément !</span>
        </div>
      )}

      {/* ── Liste des options sous forme de cartes d'alertes ──────────────── */}
      <div className="space-y-3">
        {options.map((opt) => {
          const IconComponent = opt.icon;

          return (
            <div
              key={opt.id}
              className="p-4 rounded-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{
                background: opt.state ? 'var(--background-card)' : 'var(--neutral-50)',
                borderColor: opt.state ? 'var(--border)' : 'var(--neutral-200)',
                opacity: opt.state ? 1 : 0.8,
              }}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: opt.state ? 'var(--forest-50)' : 'var(--neutral-100)',
                    color: opt.state ? 'var(--forest-700)' : 'var(--foreground-muted)',
                    border: `1px solid ${opt.state ? 'var(--forest-200)' : 'var(--border)'}`,
                  }}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-xs font-bold"
                      style={{ color: opt.state ? 'var(--forest-950)' : 'var(--foreground-muted)' }}
                    >
                      {opt.title}
                    </p>
                    <ChannelBadge channel={opt.channel} label={opt.channelLabel} active={opt.state} />
                  </div>
                  <p className="text-[0.6875rem] font-medium leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                    {opt.description}
                  </p>
                </div>
              </div>

              {/* Interrupteur Switch */}
              <div className="shrink-0 self-end sm:self-center">
                <Switch
                  checked={opt.state}
                  onChange={() => handleToggle(opt.state, opt.setter)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pied récapitulatif ─────────────────────────────────────────────── */}
      <div
        className="p-4 rounded-inner border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium"
        style={{ background: 'var(--background-alt)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2" style={{ color: 'var(--foreground-muted)' }}>
          <Sparkles className="w-4 h-4 text-forest-600" />
          <span>Canaux d'urgence et SMS gérés par l'infrastructure Klef Télécom Sénégal</span>
        </div>
        <span className="font-bold text-forest-900">Temps de réponse serveur : &lt; 50ms</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────────────────────── */

function ChannelBadge({ channel, label, active }: { channel: NotificationOption['channel']; label: string; active: boolean }) {
  if (!active) {
    return (
      <span
        className="px-2 py-0.5 rounded-pill text-[0.6rem] font-semibold"
        style={{ background: 'var(--neutral-200)', color: 'var(--neutral-600)' }}
      >
        Désactivé
      </span>
    );
  }

  let bg = 'var(--forest-50)';
  let color = 'var(--forest-800)';
  let border = 'var(--forest-200)';

  if (channel === 'WHATSAPP') {
    bg = 'var(--success-50)';
    color = 'var(--success-700)';
    border = 'var(--success-500)';
  } else if (channel === 'URGENT') {
    bg = 'var(--warning-50)';
    color = 'var(--warning-700)';
    border = 'var(--warning-500)';
  } else if (channel === 'EMAIL') {
    bg = 'var(--info-50)';
    color = 'var(--info-700)';
    border = 'var(--info-500)';
  }

  return (
    <span
      className="px-2.5 py-0.5 rounded-pill text-[0.6rem] font-bold border"
      style={{ background: bg, color: color, borderColor: border }}
    >
      {label}
    </span>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
      style={{
        background: checked ? 'var(--forest-600)' : 'var(--neutral-300)',
      }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-2xs transition duration-200 ease-in-out"
        style={{
          transform: checked ? 'translateX(1.25rem)' : 'translateX(0)',
        }}
      />
    </button>
  );
}
