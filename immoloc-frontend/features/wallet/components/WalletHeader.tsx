export function WalletHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="eyebrow">Finance & Portefeuille</span>
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
        Mon Portefeuille
      </h1>
      <p className="text-sm text-foreground-muted mt-1">
        Consultez votre solde disponible, effectuez vos retraits et suivez vos transactions en temps réel.
      </p>
    </div>
  );
}
