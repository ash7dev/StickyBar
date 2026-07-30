import { Settings } from 'lucide-react';

export function OwnerSettingsHeader() {
  return (
    <div className="flex items-center gap-3.5 pb-4 border-b border-border/70">
      <div className="w-10 h-10 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0 shadow-2xs">
        <Settings className="w-5 h-5 text-lime-400" />
      </div>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Paramètres de l'Hôte
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted mt-0.5 font-medium">
          Gérez votre profil hôte, vos coordonnées de versement Mobile Money et vos préférences d'accueil.
        </p>
      </div>
    </div>
  );
}
