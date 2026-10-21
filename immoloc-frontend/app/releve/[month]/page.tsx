'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useRoleStore } from '@/stores/role.store';
import { useOwnerStatement } from '@/features/owner-revenue/hooks/use-owner-revenue';
import { StatementBody } from '@/features/owner-revenue/components/StatementBody';
import { monthLong } from '@/features/owner-home/lib/format';
import { PaixiLogo } from '@/components/brand/PaixiLogo';

/**
 * Relevé mensuel imprimable (« Enregistrer en PDF » du navigateur), sans la
 * navigation de l'espace hôte. Ouvert depuis le bouton PDF de la page Revenus.
 */
export default function PrintableStatementPage() {
  const { month } = useParams<{ month: string }>();
  const hasToken = useRoleStore((s) => Boolean(s.nestToken));
  const { data: statement, isLoading, isError } = useOwnerStatement(hasToken ? month : null);
  const { data: user } = useCurrentUser();

  // À l'impression, seul le relevé est visible (assistant, bannières… masqués : voir globals.css)
  useEffect(() => {
    document.documentElement.classList.add('printing-statement');
    return () => document.documentElement.classList.remove('printing-statement');
  }, []);

  // Ouvre la boîte d'impression une fois le relevé affiché
  useEffect(() => {
    if (!statement) return;
    const id = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(id);
  }, [statement]);

  const [year] = (month ?? '').split('-');

  return (
    <div className="min-h-screen bg-background-alt px-4 py-10">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end">
        <button type="button" onClick={() => window.print()} className="btn-primary px-5 py-2.5 text-sm">
          <Printer className="h-4 w-4" aria-hidden="true" />
          Imprimer ou enregistrer en PDF
        </button>
      </div>

      <article id="releve" className="mx-auto max-w-3xl rounded-[24px] bg-white p-10 text-neutral-900 shadow-sm">
        <header className="mb-8 flex items-start justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-neutral-500">RELEVÉ DE REVENUS</p>
            <h1 className="mt-1.5 font-display text-3xl font-semibold capitalize">
              {month ? `${monthLong(month)} ${year}` : ''}
            </h1>
            {user?.prenom && <p className="mt-1 text-sm text-neutral-600">{[user.prenom, user.nom].filter(Boolean).join(' ')}</p>}
          </div>
          <PaixiLogo className="text-2xl" />
        </header>

        {!hasToken ? (
          <p className="text-sm">Connectez-vous à votre espace hôte pour afficher ce relevé.</p>
        ) : isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" aria-busy="true" />
        ) : isError || !statement ? (
          <p role="alert" className="text-sm text-error-700">Impossible de charger ce relevé.</p>
        ) : (
          <StatementBody statement={statement} printable />
        )}

        <footer className="mt-8 border-t border-neutral-200 pt-4 text-xs text-neutral-500">
          Montants en FCFA. Revenus comptés au mois d’arrivée des voyageurs ; la commission Paixi est payée par le voyageur en plus du prix du séjour.
        </footer>
      </article>
    </div>
  );
}
