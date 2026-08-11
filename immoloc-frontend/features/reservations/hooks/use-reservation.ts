'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';

import { listingsApi } from '@/lib/nestjs';
import { getPrixPublic } from '@/lib/pricing';
import { useTerangaClub } from '@/features/teranga-club/hooks/use-teranga-club';

import {
    nightsBetween,
    telephoneValide,
    telephoneE164,
    toLocalISO,
} from '@/features/reservations/lib/reservation';

export type TypePaiement = 'DEPOSIT' | 'FULL';
export type Fournisseur = 'WAVE' | 'ORANGE_MONEY';

export interface ReservationInit {
    listingId: string;
    dateDebut?: string;
    dateFin?: string;
    personnes?: string;
    typePaiement?: string;
}

export function useReservation(init: ReservationInit) {
    const { listingId } = init;

    // ── État de saisie ─────────────────────────────────────────────────────────
    const [dateDebut, setDateDebut] = useState(init.dateDebut ?? '');
    const [dateFin, setDateFin] = useState(init.dateFin ?? '');
    const [nbPersonnes, setNbPersonnes] = useState(() => {
        const n = Number.parseInt(init.personnes ?? '1', 10);
        return Number.isFinite(n) && n > 0 ? n : 1;
    });
    const [typePaiement, setTypePaiement] = useState<TypePaiement>(
        init.typePaiement === 'FULL' ? 'FULL' : 'DEPOSIT',
    );
    const [fournisseur, setFournisseur] = useState<Fournisseur>('WAVE');
    const [telephone, setTelephone] = useState('');
    const [useCoins, setUseCoins] = useState(false);

    // Décoché par défaut. Un consentement contractuel pré-coché n'en est pas un :
    // le locataire doit poser l'acte. Le widget desktop ne doit pas le pré-valider.
    const [cguAccepted, setCguAccepted] = useState(false);

    // ── Données ────────────────────────────────────────────────────────────────
    const { data: listing, isLoading: listingLoading } = useQuery({
        queryKey: ['listing-reserver', listingId],
        queryFn: () => listingsApi.findOne(listingId),
        enabled: !!listingId,
    });

    const nights = nightsBetween(dateDebut, dateFin);

    const {
        data: preview,
        isFetching: previewLoading,
        error: previewError,
    } = useQuery({
        queryKey: ['price-preview-reserver', listingId, dateDebut, dateFin, nbPersonnes],
        queryFn: () => listingsApi.getPricePreview(listingId, { dateDebut, dateFin, nbPersonnes }),
        enabled: !!listingId && nights > 0,
        placeholderData: (prev) => prev, // évite le clignotement du total au +/- voyageurs
    });

    const { data: teranga } = useTerangaClub();

    // La capacité n'est connue qu'après chargement : une URL forgée avec
    // ?personnes=40 doit être ramenée dans les bornes, pas envoyée au backend.
    useEffect(() => {
        const max = listing?.capaciteMax;
        if (!max) return;
        setNbPersonnes((v) => Math.min(Math.max(1, v), max));
    }, [listing?.capaciteMax]);

    // ── Tarification ───────────────────────────────────────────────────────────
    //
    // Contrat : `preview.totalLocataire` fait autorité. Tout le reste est dérivé
    // de lui, pour que la colonne des montants s'additionne toujours à l'écran.
    //
    // ⚠ getPrixPublic (×1,07) ne s'applique QU'AU catalogue. Si un jour
    // getPricePreview renvoie le prix propriétaire, c'est ici — et nulle part
    // ailleurs — qu'il faudra l'envelopper.
    const pricing = useMemo(() => {
        const prixNuitCatalogue = listing ? getPrixPublic(listing.prixBase) : 0;

        const estEstimation = !preview;
        const supplement = preview?.supplementPersonnes ?? 0;
        const total = preview?.totalLocataire ?? (nights > 0 ? prixNuitCatalogue * nights : 0);

        // Sous-total = total − supplément. Le prix/nuit affiché est déduit de lui,
        // jamais lu ailleurs : sinon la ligne « X × N nuits » ne tombe pas juste.
        const sousTotal = Math.max(0, Math.round(total - supplement));
        const prixNuit = nights > 0 ? Math.round(sousTotal / nights) : prixNuitCatalogue;

        const acomptePct = listing?.acomptePourcentage ?? 30;
        const acompteDisponible = acomptePct > 0 && acomptePct < 100;
        const enAcompte = typePaiement === 'DEPOSIT' && acompteDisponible;

        const montantDuJour = enAcompte ? Math.round(total * (acomptePct / 100)) : Math.round(total);
        const soldeArrivee = Math.max(0, Math.round(total) - montantDuJour);

        const soldeCoins = teranga?.soldeCoins ?? 0;
        const coinsMax = Math.min(soldeCoins, montantDuJour);
        const coinsUtilises = useCoins ? coinsMax : 0;
        const aDebiter = Math.max(0, montantDuJour - coinsUtilises);

        return {
            estEstimation,
            prixNuit,
            sousTotal,
            supplement,
            total: Math.round(total),
            acomptePct,
            acompteDisponible,
            enAcompte,
            montantDuJour,
            soldeArrivee,
            soldeCoins,
            coinsMax,
            coinsUtilises,
            aDebiter,
        };
    }, [listing, preview, nights, typePaiement, teranga?.soldeCoins, useCoins]);

    // ── Validation ─────────────────────────────────────────────────────────────
    const minNights = listing?.nuitesMinimum ?? 1;
    const capaciteMax = listing?.capaciteMax ?? 1;
    // Ne jamais retomber sur capaciteMax : annoncer « 10 voyageurs inclus »
    // quand la donnée manque est un mensonge tarifaire.
    const personnesBase = listing?.personnesBase;

    const erreurs = useMemo(() => {
        const dates =
            !dateDebut || !dateFin || nights <= 0
                ? 'Choisissez vos dates de séjour.'
                : nights < minNights
                    ? `Ce logement se loue à partir de ${minNights} nuits. Vous en avez sélectionné ${nights}.`
                    : null;

        const tel = !telephone
            ? 'Entrez le numéro qui recevra la demande de paiement.'
            : !telephoneValide(telephone)
                ? 'Numéro sénégalais attendu, à 9 chiffres (77, 78, 76, 75 ou 70).'
                : null;

        const cgu = cguAccepted ? null : 'Acceptez les conditions de location pour continuer.';

        return { dates, telephone: tel, cgu };
    }, [dateDebut, dateFin, nights, minNights, telephone, cguAccepted]);

    const peutContinuer = !erreurs.dates;
    // On ne débite jamais sur une estimation : le devis serveur doit être arrivé.
    const peutPayer = peutContinuer && !erreurs.telephone && !erreurs.cgu && !!preview;

    // ── Actions ────────────────────────────────────────────────────────────────

    const setPlage = useCallback((r: DateRange | undefined) => {
        const from = r?.from ? toLocalISO(r.from) : '';
        const to = r?.to ? toLocalISO(r.to) : '';
        setDateDebut(from);
        // Reprendre un nouveau départ invalide l'ancienne fin. Sans ça, on peut
        // se retrouver avec une arrivée postérieure au départ et un total négatif.
        setDateFin(to && from && to > from ? to : '');
    }, []);

    const ajusterPersonnes = useCallback(
        (delta: number) => setNbPersonnes((v) => Math.min(Math.max(1, v + delta), capaciteMax)),
        [capaciteMax],
    );

    // Un acompte non disponible ne doit pas laisser l'écran en mode DEPOSIT.
    useEffect(() => {
        if (!pricing.acompteDisponible && typePaiement === 'DEPOSIT') setTypePaiement('FULL');
    }, [pricing.acompteDisponible, typePaiement]);

    // Le solde de Coins peut tomber à zéro entre deux écrans.
    useEffect(() => {
        if (pricing.coinsMax <= 0 && useCoins) setUseCoins(false);
    }, [pricing.coinsMax, useCoins]);

    /** Corps exact envoyé à POST /reservations. */
    const payload = useMemo(
        () => ({
            logementId: listingId,
            dateDebut,
            dateFin,
            nbPersonnes,
            typePaiement,
            fournisseur,
            // Le numéro était saisi puis jeté : le back recevait la réservation sans
            // savoir sur quel téléphone pousser la demande Wave / Orange Money.
            telephone: telephoneE164(telephone),
            useCoins,
        }),
        [listingId, dateDebut, dateFin, nbPersonnes, typePaiement, fournisseur, telephone, useCoins],
    );

    return {
        listing,
        listingLoading,
        previewLoading,
        previewError,
        teranga,

        dateDebut,
        dateFin,
        nights,
        nbPersonnes,
        typePaiement,
        fournisseur,
        telephone,
        useCoins,
        cguAccepted,

        minNights,
        capaciteMax,
        personnesBase,
        pricing,
        erreurs,
        peutContinuer,
        peutPayer,
        payload,

        setPlage,
        ajusterPersonnes,
        setTypePaiement,
        setFournisseur,
        setTelephone,
        setUseCoins,
        setCguAccepted,
    };
}

export type ReservationState = ReturnType<typeof useReservation>;