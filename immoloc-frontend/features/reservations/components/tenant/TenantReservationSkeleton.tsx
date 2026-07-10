export function TenantReservationSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-16 space-y-5 animate-pulse">
      {/* Retour + ID */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-neutral-100 rounded-lg" />
        <div className="h-6 w-20 bg-neutral-100 rounded-lg" />
      </div>

      {/* Hero dark card */}
      <div className="bg-surface-dark rounded-3xl overflow-hidden">
        <div className="h-0.5 w-full bg-neutral-700" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-7 w-28 bg-white/8 rounded-xl" />
                <div className="h-4 w-36 bg-white/8 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-32 bg-white/8 rounded" />
                <div className="h-8 w-72 bg-white/8 rounded-xl" />
              </div>
              <div className="h-16 w-full max-w-sm bg-white/8 rounded-2xl" />
              <div className="h-5 w-32 bg-white/8 rounded-lg" />
            </div>
            <div className="md:w-56 shrink-0 space-y-3">
              <div className="h-44 w-full bg-white/8 rounded-2xl" />
              <div className="h-20 bg-white/8 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Contrat */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-100 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-neutral-100 rounded-lg" />
            <div className="h-3 w-52 bg-neutral-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-neutral-100 rounded-xl" />
      </div>

      {/* Hôte + Logement */}
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-100 rounded-xl" />
              <div className="h-4 w-24 bg-neutral-100 rounded-lg" />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-neutral-100 rounded-lg" />
                  <div className="h-3 w-24 bg-neutral-100 rounded-lg" />
                </div>
              </div>
              <div className="border-t border-neutral-100 pt-3 space-y-2.5">
                <div className="h-4 w-full bg-neutral-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial */}
      <div className="bg-surface-dark rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/8 rounded-xl" />
          <div className="h-4 w-40 bg-white/8 rounded-lg" />
        </div>
        <div className="p-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between py-2">
              <div className="h-4 bg-white/8 rounded-lg" style={{ width: `${40 + i * 8}%` }} />
              <div className="h-4 w-24 bg-white/8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
