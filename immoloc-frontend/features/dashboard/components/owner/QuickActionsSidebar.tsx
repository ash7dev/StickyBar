'use client';

import { CalendarCheck, MessageSquareWarning, PlusCircle, Wallet, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const ACTIONS = [
  {
    icon: CalendarCheck,
    label: 'Confirmer réservations',
    sub: 'Accepter les demandes payées',
    href: '/dashboard/reservations?statut=PENDING',
    gradient: 'from-primary-500 to-primary-600',
    iconBg: 'bg-primary-500/10',
    iconText: 'text-primary-500',
    glowColor: 'primary',
  },
  {
    icon: MessageSquareWarning,
    label: 'Déclarer un litige',
    sub: 'Signaler un problème sur un séjour',
    href: '/dashboard/litiges/nouveau',
    gradient: 'from-error-500 to-error-600',
    iconBg: 'bg-error-500/10',
    iconText: 'text-error-500',
    glowColor: 'error',
  },
  {
    icon: PlusCircle,
    label: 'Ajouter un bien',
    sub: 'Mettre un nouveau bien en ligne',
    href: '/dashboard/annonces/nouvelle',
    gradient: 'from-neutral-800 to-neutral-900',
    iconBg: 'bg-neutral-900/10',
    iconText: 'text-neutral-900',
    glowColor: 'neutral',
  },
  {
    icon: Wallet,
    label: 'Retirer des fonds',
    sub: 'Accéder au portefeuille',
    href: '/dashboard/wallet',
    gradient: 'from-accent-500 to-accent-600',
    iconBg: 'bg-accent-500/10',
    iconText: 'text-accent-600',
    glowColor: 'accent',
  },
];

function ActionCard({ action, index }: { action: typeof ACTIONS[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={action.href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group block"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 100}ms both`
      }}
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`}
        style={{
          background: `var(--${action.glowColor}-500)`,
          filter: 'blur(20px)',
          opacity: isHovered ? 0.15 : 0,
        }}
      />

      <div className="relative flex items-center gap-3 p-3 rounded-xl border border-border bg-background-card hover:bg-background-alt transition-all duration-300 group-hover:border-border-hover group-hover:-translate-y-0.5 group-hover:shadow-md">

        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.iconBg} backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 shrink-0`}>
          <action.icon className={`w-4 h-4 ${action.iconText}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-foreground group-hover:text-primary-600 transition-colors duration-300 truncate">
            {action.label}
          </h4>
          <p className="text-[11px] text-foreground-muted truncate">
            {action.sub}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />

        {/* Bottom accent bar (appears on hover) */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${action.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-xl`} />
      </div>
    </Link>
  );
}

export function QuickActionsSidebar() {
  return (
    <div className="bg-background-card rounded-2xl p-6 border border-border h-full flex flex-col hover:shadow-lg transition-all duration-300">

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Actions rapides</h3>
          <p className="text-xs text-foreground-muted">Raccourcis essentiels</p>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="flex flex-col gap-3 flex-1">
        {ACTIONS.map((action, index) => (
          <ActionCard key={action.label} action={action} index={index} />
        ))}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
