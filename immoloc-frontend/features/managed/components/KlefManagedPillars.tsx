'use client';

import { Camera, ClipboardCheck, KeyRound, Wallet } from 'lucide-react';

const PILLARS = [
  {
    icon: Camera,
    title: 'Création & photos professionnelles',
    description: "Notre équipe se déplace sur place pour réaliser une mise en valeur photo de votre logement et créer l'annonce optimale.",
    badge: 'Mise en valeur 5★',
  },
  {
    icon: KeyRound,
    title: 'Gestion intégrale des voyageurs',
    description: 'De la sélection des locataires à la remise des clés en passant par la communication 7j/7, nous gérons tout pour vous.',
    badge: '100% délégué',
  },
  {
    icon: ClipboardCheck,
    title: 'États des lieux & relevés compteurs',
    description: 'Chaque entrée et sortie est documentée numériquement avec photos certifiées et relevés du compteur Woyofal/Senelec.',
    badge: 'Zéro dégât inconnu',
  },
  {
    icon: Wallet,
    title: 'Reversements instantanés Wave & OM',
    description: 'Consultez votre solde en temps réel et recevez vos versements directement sur votre compte Mobile Money ou bancaire.',
    badge: 'Paiement garanti',
  },
];

export function KlefManagedPillars() {
  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <p className="eyebrow">Pourquoi choisir Klef Managed ?</p>
        <h2>Une conciergerie moderne pensée pour votre sérénité</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="card flex flex-col justify-between gap-4 p-6 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="icon-tile h-11 w-11">
                  <p.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="badge-soft">{p.badge}</span>
              </div>
              <h3>{p.title}</h3>
              <p className="text-xs leading-relaxed text-foreground-muted">{p.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}