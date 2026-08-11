'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Gift, Handshake, MessageCircle, Share2 } from 'lucide-react';
import {
  terangaClubApi,
  type TerangaReferralInfo,
  type TerangaReferralFilleul,
} from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface Props {
  isAuthenticated: boolean;
  codeParrainageFallback?: string | null;
}

/* ⚠️ Récompense écrite en dur à trois endroits, et recalculée côté client :
   `nbFilleulsActifs * 2500`. Si la règle change, si un filleul a été crédité
   à un ancien barème, ou si un crédit a été annulé, le chiffre affiché ne
   correspond plus au solde réel. Ce montant doit venir de l'API — idéalement
   avec un `coinsGagnesParrainage` déjà agrégé côté serveur.
   En attendant, une seule constante nommée. */
const COINS_PAR_FILLEUL = 2500;

/* `window.location.origin` était lu pendant le rendu : côté serveur il vaut
   'https://klef.sn', côté client l'origine réelle. Le lien changeait entre le
   HTML et l'hydratation. */
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://klef.sn';

export function TerangaReferralCard({ isAuthenticated, codeParrainageFallback }: Props) {
  const [info, setInfo] = useState<TerangaReferralInfo | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(false);
  const [copie, setCopie] = useState<'idle' | 'ok' | 'echec'>('idle');
  const [partageNatif, setPartageNatif] = useState(false);

  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPartageNatif(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let annule = false;
    setChargement(true);
    setErreur(false);
    terangaClubApi
      .getReferralInfo()
      .then((res) => {
        if (!annule) setInfo(res);
      })
      /* `.catch(() => null)` était silencieux : en cas d'échec, la carte
         affichait « 0 filleul » comme un fait alors que le chiffre était
         inconnu. */
      .catch(() => {
        if (!annule) setErreur(true);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [isAuthenticated]);

  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    },
    [],
  );

  const code = info?.codeParrainage || codeParrainageFallback || null;
  const lien = code ? `${BASE_URL}/register?ref=${code}` : null;

  const texte = code
    ? `Rejoins-moi sur Klef pour réserver tes séjours au Sénégal. Utilise mon code parrain *${code}* à l’inscription : ${lien}`
    : '';
  const whatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(texte)}`;

  const signaler = useCallback((etat: 'ok' | 'echec') => {
    if (minuteur.current) clearTimeout(minuteur.current);
    setCopie(etat);
    minuteur.current = setTimeout(() => setCopie('idle'), 2500);
  }, []);

  const copier = useCallback(async () => {
    if (!lien) return;
    try {
      await navigator.clipboard.writeText(lien);
      signaler('ok');
    } catch {
      /* Le `catch` était vide : hors HTTPS ou sur navigateur ancien, le clic
         ne produisait rien du tout et l'utilisateur croyait avoir copié. */
      signaler('echec');
    }
  }, [lien, signaler]);

  const partager = useCallback(async () => {
    if (!lien) return;
    try {
      await navigator.share({ title: 'Klef', text: texte, url: lien });
    } catch {
      // Partage annulé par l'utilisateur : rien à signaler.
    }
  }, [lien, texte]);

  const filleuls = info?.nbFilleuls;
  const filleulsActifs = info?.nbFilleulsActifs;
  const coinsGagnes =
    filleulsActifs != null ? filleulsActifs * COINS_PAR_FILLEUL : undefined;

  const stats = [
    { cle: 'inscrits', label: 'Filleuls inscrits', valeur: filleuls },
    { cle: 'sejours', label: 'Ont réservé', valeur: filleulsActifs },
    { cle: 'coins', label: 'Coins gagnés', valeur: coinsGagnes },
  ];

  return (
    <section className="card space-y-6 p-6 sm:p-8">
      {/* ── En-tête ────────────────────────────────────────────────────────
          L'emoji 🤝 n'est pas stylable et rend différemment selon l'OS. */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-start gap-3.5">
          <span className="marker-box h-12 w-12 shrink-0">
            <Handshake className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Parrainage Teranga
              </h2>
              <span className="badge-verified">
                +{COINS_PAR_FILLEUL.toLocaleString('fr-FR')} coins par filleul
              </span>
            </div>
            {/* ⚠️ Le badge annonçait « +2 500 Coins » et la phrase juste en
                dessous « Vous gagnez 2 500 FCFA ». Deux unités différentes pour
                la même récompense, sur une promesse faite à l'utilisateur.
                Les coins font foi — c'est ce que compte la carte plus bas. */}
            <p className="mt-1 text-xs text-foreground-muted">
              Invitez un proche : dès sa première réservation, vous recevez{' '}
              {COINS_PAR_FILLEUL.toLocaleString('fr-FR')} Klef Coins.
            </p>
          </div>
        </div>
      </header>

      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-background-alt p-8 text-center">
          <Gift className="h-8 w-8 text-forest-600" aria-hidden />
          <div className="max-w-md space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Connectez-vous pour obtenir votre code
            </h3>
            <p className="text-xs text-foreground-muted">
              Votre lien de parrainage est unique et vous suit sur chaque invitation.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {erreur && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-inner bg-warning-50 px-3.5 py-2.5 text-xs text-warning-700"
            >
              <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden />
              Vos statistiques de parrainage n’ont pas pu être chargées. Les compteurs
              ci-dessous sont indisponibles — ils ne sont pas à zéro pour autant.
            </p>
          )}

          {/* ── Lien et partage ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-3 rounded-card border border-border bg-background-alt p-4 sm:p-5 lg:col-span-7">
              <p className="text-xs font-semibold text-foreground-muted">
                Votre lien de parrainage
              </p>

              {chargement && !code ? (
                <div className="h-10 animate-pulse rounded-inner bg-background-card" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-inner border border-border bg-background-card px-3 py-2">
                    <span className="shrink-0 font-mono text-xs font-semibold text-forest-700">
                      {code ?? '—'}
                    </span>
                    <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
                    <span className="select-all truncate font-mono text-xs text-foreground-muted">
                      {/* Sans code, le lien copié ne créditait personne. */}
                      {lien ?? 'Code indisponible'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={copier}
                    disabled={!lien}
                    aria-label="Copier le lien de parrainage"
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-border bg-background-card px-3.5 py-2 text-xs font-semibold transition-colors',
                      'hover:bg-background-alt disabled:cursor-not-allowed disabled:opacity-40',
                      copie === 'ok' && 'text-success-700',
                      copie === 'echec' && 'text-error-700',
                    )}
                  >
                    {copie === 'ok' ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden />
                        Copié
                      </>
                    ) : copie === 'echec' ? (
                      <>
                        <AlertTriangle className="h-4 w-4" aria-hidden />
                        Échec
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-foreground-muted" aria-hidden />
                        Copier
                      </>
                    )}
                  </button>
                </div>
              )}

              {copie === 'echec' && (
                <p role="alert" className="text-xs text-error-700">
                  La copie a échoué. Sélectionnez le lien ci-dessus pour le copier à la main.
                </p>
              )}
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-card border border-border bg-background-alt p-4 sm:p-5 lg:col-span-5">
              <p className="text-xs font-semibold text-foreground-muted">Partager</p>

              {/* Sur mobile, la feuille de partage native ouvre WhatsApp,
                  Messenger, SMS et le reste en un geste. */}
              {partageNatif ? (
                <button
                  type="button"
                  onClick={partager}
                  disabled={!lien}
                  className="btn-primary w-full py-2.5 text-xs disabled:opacity-40"
                >
                  <Share2 className="h-4 w-4" aria-hidden />
                  Partager mon lien
                </button>
              ) : (
                /* Texte sombre sur le vert WhatsApp : le blanc dessus donne
                   2,1:1, sous le seuil AA. Le vert reste reconnaissable. */
                <a
                  href={lien ? whatsapp : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!lien}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-pill bg-[#25D366] px-4 py-2.5 text-xs font-semibold text-forest-950 transition-opacity hover:opacity-90',
                    !lien && 'pointer-events-none opacity-40',
                  )}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Partager sur WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* ── Compteurs ────────────────────────────────────────────────── */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map(({ cle, label, valeur }) => (
              <div
                key={cle}
                className={cn(
                  'rounded-card border border-border bg-background-card p-3.5 text-center',
                  cle === 'coins' && 'col-span-2 sm:col-span-1',
                )}
              >
                <dt className="text-xs text-foreground-muted">{label}</dt>
                <dd className="mt-1">
                  {chargement ? (
                    <span className="mx-auto block h-6 w-12 animate-pulse rounded-pill bg-background-alt" />
                  ) : (
                    /* Le compteur « Coins gagnés » était en or : dans le
                       système, l'or porte le statut — badge Vérifié, étoiles —
                       pas une quantité. */
                    <span
                      className={cn(
                        'block font-display text-xl font-semibold tabular-nums',
                        valeur == null ? 'text-foreground-muted' : 'text-foreground',
                      )}
                    >
                      {valeur == null ? '—' : valeur.toLocaleString('fr-FR')}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {/* ── Filleuls ─────────────────────────────────────────────────── */}
          {info?.filleuls && info.filleuls.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-xs font-semibold text-foreground">
                Vos filleuls
                <span className="ml-1.5 font-normal tabular-nums text-foreground-muted">
                  {info.filleuls.length}
                </span>
              </h3>

              <ul className="divide-y divide-border overflow-hidden rounded-inner border border-border bg-background-card">
                {info.filleuls.map((f: TerangaReferralFilleul) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-forest-50 text-xs font-semibold text-forest-700"
                      >
                        {f.initiale}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{f.prenom}</p>
                        <p className="text-xs tabular-nums text-foreground-muted">
                          Inscrit le {new Date(f.inscritLe).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {f.aReserve ? (
                      /* `emerald-*` n'existe pas dans la palette Klef : ce badge
                         rendait sans fond, sans bordure et sans couleur. */
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-success-500/25 bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
                        <Check className="h-3 w-3" aria-hidden />
                        +{COINS_PAR_FILLEUL.toLocaleString('fr-FR')}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-pill border border-border bg-background-alt px-2.5 py-1 text-xs text-foreground-muted">
                        En attente de séjour
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}