'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur pour le monitoring
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 px-4">
          <div className="w-full max-w-md text-center">
            {/* Icône d'erreur */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
            </div>

            {/* Message */}
            <h1 className="mb-3 text-2xl font-black text-neutral-900">
              Une erreur est survenue
            </h1>
            <p className="mb-8 text-sm text-neutral-600 leading-relaxed">
              Nous sommes désolés, une erreur inattendue s'est produite.
              Veuillez réessayer ou retourner à l'accueil.
            </p>

            {/* Détails de l'erreur (en dev uniquement) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-left">
                <p className="text-xs font-bold text-red-800 mb-2">Détails (DEV only)</p>
                <p className="text-xs text-red-700 font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl transition-colors border border-neutral-200 shadow-sm"
              >
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
