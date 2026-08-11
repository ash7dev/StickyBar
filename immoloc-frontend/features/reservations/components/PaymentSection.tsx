'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Coins, Wallet } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { SectionCard, OptionCard, Checkbox, Alerte, Montant } from './primitives';
import { masquerTelephone, pluriel } from '@/features/reservations/lib/reservation';
import type { Fournisseur, ReservationState } from '@/features/reservations/hooks/use-reservation';


const OPERATEURS: { id: Fournisseur; nom: string; logo: string; note: string }[] = [
    { id: 'WAVE', nom: 'Wave', logo: '/wavelogo.jpeg', note: 'Sans frais' },
    { id: 'ORANGE_MONEY', nom: 'Orange Money', logo: '/orangeMoneylogo.png', note: 'Frais opérateur' },
];

export function PaymentSection({ r, montreErreurs }: { r: ReservationState; montreErreurs: boolean }) {
    const { pricing } = r;

    return (
        <div className="space-y-4">
            {/* ── Répartition du paiement ──────────────────────────────────────── */}
            {pricing.acompteDisponible && (
                <SectionCard title="Quand payer" icon={Wallet}>
                    <div
                        role="radiogroup"
                        aria-label="Répartition du paiement"
                        className="grid gap-3 sm:grid-cols-2"
                    >
                        <OptionCard
                            name="repartition"
                            selected={r.typePaiement === 'DEPOSIT'}
                            onSelect={() => r.setTypePaiement('DEPOSIT')}
                            className="pr-12"
                        >
                            <p className="text-sm font-semibold text-foreground">
                                {pricing.acomptePct}% maintenant
                            </p>
                            <p className="mt-1 text-xs text-foreground-muted">
                                <Montant
                                    value={Math.round(pricing.total * (pricing.acomptePct / 100))}
                                    pending={pricing.estEstimation}
                                />{' '}
                                aujourd&apos;hui, le reste à la remise des clés.
                            </p>
                        </OptionCard>

                        <OptionCard
                            name="repartition"
                            selected={r.typePaiement === 'FULL'}
                            onSelect={() => r.setTypePaiement('FULL')}
                            className="pr-12"
                        >
                            <p className="text-sm font-semibold text-foreground">Tout maintenant</p>
                            <p className="mt-1 text-xs text-foreground-muted">
                                <Montant value={pricing.total} pending={pricing.estEstimation} /> en une fois, rien
                                à régler sur place.
                            </p>
                        </OptionCard>
                    </div>
                </SectionCard>
            )}

            {/* ── Klef Coins ───────────────────────────────────────────────────────
          Une ligne, pas une carte promotionnelle. Le lime tient dans le
          squircle d'icône ; le reste est neutre. */}
            {pricing.coinsMax > 0 && (
                <SectionCard>
                    <Checkbox id="use-coins" checked={r.useCoins} onChange={r.setUseCoins}>
                        <span className="flex items-start gap-3">
                            <span className="marker-box h-9 w-9 shrink-0">
                                <Coins className="h-4 w-4" aria-hidden />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold text-foreground">
                                    Utiliser mes Klef Coins
                                </span>
                                <span className="mt-0.5 block text-xs text-foreground-muted">
                                    <Montant value={pricing.coinsMax} /> déduits de ce paiement · solde{' '}
                                    <Montant value={pricing.soldeCoins} suffix=" coins" />
                                </span>
                            </span>
                        </span>
                    </Checkbox>
                </SectionCard>
            )}

            {/* ── Opérateur + numéro ───────────────────────────────────────────── */}
            <SectionCard title="Payer avec">
                <div role="radiogroup" aria-label="Opérateur mobile money" className="grid gap-3 sm:grid-cols-2">
                    {OPERATEURS.map((op) => (
                        <OptionCard
                            key={op.id}
                            name="operateur"
                            selected={r.fournisseur === op.id}
                            onSelect={() => r.setFournisseur(op.id)}
                            className="flex items-center gap-3 pr-12"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-inner border border-border bg-neutral-0">
                                <Image src={op.logo} alt="" width={44} height={44} className="object-contain" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm font-semibold text-foreground">{op.nom}</span>
                                <span className="block text-xs text-foreground-muted">{op.note}</span>
                            </span>
                        </OptionCard>
                    ))}
                </div>

                <div className="mt-5 space-y-2">
                    <label htmlFor="tel-momo" className="block text-xs font-semibold text-foreground">
                        Numéro {r.fournisseur === 'WAVE' ? 'Wave' : 'Orange Money'}
                    </label>

                    <div className="flex items-stretch overflow-hidden rounded-pill border border-border bg-background-alt transition-colors focus-within:border-forest-600">
                        <span className="flex items-center border-r border-border px-3.5 text-sm font-medium tabular-nums text-foreground-muted">
                            +221
                        </span>
                        {/*
              Pas de `text-sm` ici : la couche utilities écrase la règle de base
              qui force 16px, et Safari iOS zoome alors au focus.
            */}
                        <input
                            id="tel-momo"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            maxLength={12}
                            value={masquerTelephone(r.telephone)}
                            onChange={(e) => r.setTelephone(e.target.value)}
                            placeholder="77 123 45 67"
                            aria-invalid={montreErreurs && !!r.erreurs.telephone}
                            className="w-full bg-transparent px-3.5 py-3 font-medium tabular-nums text-foreground placeholder:text-neutral-500 focus:outline-none"
                        />
                    </div>

                    {montreErreurs && r.erreurs.telephone ? (
                        <Alerte>{r.erreurs.telephone}</Alerte>
                    ) : (
                        <p className="px-1 text-xs text-foreground-muted">
                            La demande de paiement arrive sur ce numéro. Validez-la depuis votre application.
                        </p>
                    )}
                </div>
            </SectionCard>

            {/* ── Consentement ─────────────────────────────────────────────────── */}
            <SectionCard>
                <Checkbox
                    id="cgu"
                    checked={r.cguAccepted}
                    onChange={r.setCguAccepted}
                    invalid={montreErreurs && !!r.erreurs.cgu}
                >
                    J&apos;accepte les{' '}
                    <Link
                        href="/cgu"
                        target="_blank"
                        className="font-semibold text-link underline-offset-2 hover:underline"
                    >
                        conditions de location
                    </Link>{' '}
                    et le contrat de réservation, qui me sera envoyé après confirmation.
                </Checkbox>

                {montreErreurs && r.erreurs.cgu && (
                    <div className="pt-3">
                        <Alerte>{r.erreurs.cgu}</Alerte>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}

/* ── Rappel du séjour, replié — mobile étape 2 ────────────────────────────── */

export function RappelSejour({
    r,
    onModifier,
    className,
}: {
    r: ReservationState;
    onModifier?: () => void;
    className?: string;
}) {
    const { listing, nights, nbPersonnes } = r;
    return (
        <div className={cn('card flex items-center justify-between gap-3 p-3', className)}>
            <div className="flex items-center gap-3 min-w-0">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-inner bg-background-alt">
                    {listing?.photos?.[0] && (
                        <Image
                            src={(listing.photos.find((p: { estPrincipale?: boolean; url: string }) => p.estPrincipale) ?? listing.photos[0]).url}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                        />
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{listing?.titre ?? '—'}</p>
                    <p className="mt-0.5 truncate text-xs text-foreground-muted">
                        {nights} {pluriel(nights, 'nuit')} · {nbPersonnes} {pluriel(nbPersonnes, 'voyageur')}
                    </p>
                </div>
            </div>
            {onModifier && (
                <button
                    type="button"
                    onClick={onModifier}
                    className="shrink-0 rounded-pill bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-forest-100 transition-colors"
                >
                    Modifier
                </button>
            )}
        </div>
    );
}