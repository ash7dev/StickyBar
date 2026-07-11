/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  BarChart3,
  Shield,
  Clock,
  Loader2
} from 'lucide-react';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';
import { useToastError } from '@/lib/hooks/use-toast-error';
import { createClient } from '@/lib/supabase/client';

export default function BecomeHostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { estProprietaire, setSession, nestToken, refreshToken, tokenExpiresAt, activeRole, userId, hasAnnonce, hasHydrated } = useRoleStore();
  const { showError, showSuccess } = useToastError();

  const [supabaseReady, setSupabaseReady] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  // 1. Session Supabase
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setSupabaseUser(data.user ?? null);
      setSupabaseReady(true);
    });
  }, []);

  // 2. Gestion des redirections
  useEffect(() => {
    if (!hasHydrated || !supabaseReady) return;

    if (!supabaseUser && !nestToken) {
      router.replace(`/login?next=${encodeURIComponent('/become-host')}`);
      return;
    }

    if (estProprietaire) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, supabaseReady, supabaseUser, nestToken, estProprietaire, router]);

  // Écran d'attente pendant que la session se synchronise ou s'hydrate
  if (!hasHydrated || !supabaseReady || (supabaseUser && !nestToken)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-sm text-neutral-400">Vérification de votre session...</p>
        </div>
      </div>
    );
  }

  if (estProprietaire || (!supabaseUser && !nestToken)) {
    return null;
  }

  async function handleBecomeHost() {
    setLoading(true);
    try {
      const result = await nestFetch<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
          id: string;
          activeRole: 'PROPRIETAIRE';
          estProprietaire: boolean;
          hasAnnonce: boolean;
        };
      }>(NEST_API.AUTH.BECOME_HOST, {
        method: 'POST',
        body: JSON.stringify({ typeHote: 'PARTICULIER' }),
      });

      // Mettre à jour le store avec le nouveau rôle
      setSession({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        role: 'PROPRIETAIRE',
        estProprietaire: true,
        userId: result.user.id,
        hasAnnonce: result.user.hasAnnonce,
      });

      showSuccess(
        'Espace propriétaire activé !',
        'Vous pouvez maintenant ajouter vos logements'
      );

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('[BecomeHost] Activation failed:', error);
      showError(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 lg:py-20">
      <div className="w-full max-w-2xl">
        {/* ── Carte principale centrée ──────────────────────────── */}
        <div className="bg-background-card rounded-[32px] lg:rounded-[40px] border border-border shadow-2xl shadow-accent-500/10 p-8 lg:p-12">

          {/* ── Icône du logement ────────────────────────────────── */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-[24px] bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Building2 className="w-10 h-10 lg:w-12 lg:h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* ── Titre et sous-titre ──────────────────────────────── */}
          <div className="text-center mb-10">
            <h1 className="text-3xl lg:text-4xl font-black text-foreground mb-3 tracking-tight">
              Devenir propriétaire
            </h1>
            <p className="text-base lg:text-lg text-foreground-muted leading-relaxed max-w-md mx-auto">
              Commencez à louer vos logements dès aujourd&apos;hui
            </p>
          </div>

          {/* ── Liste des avantages ──────────────────────────────── */}
          <div className="space-y-4 mb-10">
            {[
              { text: 'Publiez vos logements en 5 minutes', icon: Clock },
              { text: 'Recevez des paiements sécurisés', icon: Shield },
              { text: 'Gérez vos réservations en temps réel', icon: CheckCircle2 },
              { text: 'Accédez aux statistiques de votre flotte', icon: BarChart3 },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 group"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center mt-0.5">
                  <item.icon className="w-3.5 h-3.5 text-primary-600" strokeWidth={3} />
                </div>
                <p className="text-base lg:text-lg text-foreground font-medium leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* ── Bouton CTA principal ─────────────────────────────── */}
          <button
            onClick={handleBecomeHost}
            disabled={loading}
            className={cn(
              "w-full py-4 lg:py-5 rounded-2xl font-black text-base lg:text-lg transition-all duration-200",
              "bg-primary-600 text-white",
              "hover:bg-primary-700",
              "active:scale-[0.98] shadow-xl shadow-primary-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? 'Activation en cours...' : 'Activer mon espace propriétaire'}
          </button>

          {/* ── Note d'information ───────────────────────────────── */}
          <p className="text-center text-sm text-foreground-muted mt-6 leading-relaxed px-4">
            Vous pourrez ajouter vos logements et compléter votre KYC depuis votre espace.
          </p>
        </div>
      </div>
    </div>
  );
}
