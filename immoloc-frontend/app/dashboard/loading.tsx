import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-neutral-300">
          Chargement du tableau de bord...
        </p>
      </div>
    </div>
  );
}
