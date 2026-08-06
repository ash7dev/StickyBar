'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, BarChart3, Shield, Clock, Loader2 } from 'lucide-react';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useToastError } from '@/lib/hooks/use-toast-error';

const AVANTAGES = [
  { icon: Clock, text: 'Publiez vos logements en quelques minutes' },
  { icon: Shield, text: 'Recevez des paiements sécurisés sous séquestre' },
  { icon: CheckCircle2, text: 'Gérez vos réservations en temps réel' },
  { icon: BarChart3, text: 'Suivez les statistiques de vos logements' },
];

export default function BecomeHostPage() {
  const router = useRouter();
  const setSession = useRoleStore((s) => s.setSession);
  const { showError, showSuccess } = useToastError();
  const [loading, setLoading] = useState(false);

  const handleBecomeHost = useCallback(async () => {
    setLoading(true);
    try {
      const result = await nestFetch<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: { id: string; activeRole: 'PROPRIETAIRE'; estProprietaire: boolean; hasAnnonce: boolean };
      }>(NEST_API.AUTH.BECOME_HOST, {
        method: 'POST',
        body: JSON.stringify({ typeHote: 'PARTICULIER' }),
      });

      setSession({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        role: 'PROPRIETAIRE',
        estProprietaire: true,
        userId: result.user.id,
        hasAnnonce: result.user.hasAnnonce,
      });

      showSuccess('Espace propriétaire activé', 'Vous pouvez maintenant publier vos logements.');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      /* Le blocage préalable est retiré : on redirige ici plutôt que
         d'afficher une erreur d'API brute à un visiteur non connecté. */
      const message = error instanceof Error ? error.message : '';
      if (/401|403|non authentifi|unauthorized/i.test(message)) {
        router.push(`/login?next=${encodeURIComponent('/become-host')}`);
        return;
      }
      showError(error);
      setLoading(false);
    }
  }, [setSession, showSuccess, showError, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12 lg:py-20">
      <div className="w-full max-w-2xl">
        <div className="rounded-card border border-border bg-background-card p-8 shadow-lg lg:p-12">

          <div className="mb-8 flex justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-card border border-forest-100 bg-forest-50 text-forest-700 lg:h-24 lg:w-24">
              <Building2 className="h-10 w-10 lg:h-12 lg:w-12" aria-hidden="true" />
            </span>
          </div>

          <div className="mb-10 text-center">
            <h1 className="mb-3 font-display text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Devenir propriétaire
            </h1>
            <p className="mx-auto max-w-md text-base leading-relaxed text-foreground-muted lg:text-lg">
              Mettez vos logements en location sur Klef.
            </p>
          </div>

          <ul className="mb-10 space-y-4">
            {AVANTAGES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-forest-100 bg-forest-50 text-forest-600">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <p className="text-base leading-relaxed text-foreground">{text}</p>
              </li>
            ))}
          </ul>

          {/* ★ Seul aplat lime : la conversion, unique raison d'être de la page. */}
          <button
            type="button"
            onClick={handleBecomeHost}
            disabled={loading}
            className="btn-action w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60 lg:py-5 lg:text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Activation…
              </>
            ) : (
              'Activer mon espace propriétaire'
            )}
          </button>

          <p className="mt-6 text-center text-sm leading-relaxed text-foreground-muted">
            Vous pourrez ajouter vos logements et compléter votre vérification d’identité depuis
            votre espace.
          </p>
        </div>
      </div>
    </div>
  );
}