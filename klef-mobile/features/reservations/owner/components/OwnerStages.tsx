import React from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import {
  AlertTriangle,
  Banknote,
  Calendar,
  Camera,
  Check,
  Clock,
  Lock,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Star,
  Wallet,
} from 'lucide-react-native';
import { colors, typography } from '../../../../shared/theme/tokens';
import { formatFCFA } from '../../../owner-home/lib/format';
import type { DemandeFraisReservation, ReservationDetail } from '../../types/reservation-detail.types';
import { clock, longDate, reviewDaysLeft, shortDate, stayHours, timeLeft } from '../../tenant/lib/stage';
import {
  BigAmount,
  Body,
  HostRow,
  INK,
  InfoNote,
  NowCard,
  NowTitle,
  PAPER,
  PillButton,
  StageHeadline,
  StatusChip,
  StayHero,
  Steps,
  StickyBar,
  tap,
} from '../../tenant/components/ui';
import type { OwnerActions } from '../hooks/useOwnerActions';
import {
  autoCheckinAt,
  CHECKIN_WINDOW_MS,
  CHECKOUT_WINDOW_MS,
  DISPUTE_WINDOW_MS,
  HOST_ABSENCE_GRACE_MS,
  NOSHOW_AFTER_MS,
  NOSHOW_CLOSE_MS,
  cashBalance,
  disputeOpen,
  guestPhoneUnlocked,
  hostPayout,
  noshowSignaledAt,
  plus,
  type OwnerStage,
} from '../lib/stage';

export interface OwnerHandlers {
  actions: OwnerActions;
  currentUserId?: string;
  onAccept: () => void;
  onRefuse: () => void;
  onCancel: () => void;
  onCheckinCamera: () => void;
  onCheckoutCamera: () => void;
  onNoshow: () => void;
  onFee: () => void;
  onDispute: (motif?: string) => void;
  onGallery: (type: 'CHECKIN' | 'CHECKOUT') => void;
  onDossier: () => void;
  onSupport: () => void;
  onCalendar: () => void;
  onWallet: () => void;
}

const KYC: Record<string, { label: string; ok: boolean }> = {
  VERIFIE: { label: 'Identité vérifiée', ok: true },
  EN_ATTENTE: { label: 'Vérification en cours', ok: false },
  A_RENOUVELER: { label: 'Pièce à renouveler', ok: false },
};

const DISPUTE_LABELS: Record<string, string> = {
  LOGEMENT_NON_CONFORME: 'Logement non conforme',
  LOGEMENT_INACCESSIBLE: 'Accès impossible',
  DOMMAGES: 'Dégâts ou propreté',
  DEPASSEMENT_PERSONNES: 'Voyageurs en plus',
  NON_PAIEMENT: 'Supplément impayé',
  AUTRE: 'Autre motif',
};

const FEE_STATUS: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: colors.gold[700] },
  PAYE: { label: 'Payé', color: colors.forest[600] },
  REFUSE: { label: 'Contesté', color: colors.error[700] },
  CONTESTE: { label: 'Contesté', color: colors.error[700] },
};

const fcfa = (n: number | string | null | undefined) => formatFCFA(Number(n ?? 0));
const amountOnly = (n: number | string | null | undefined) => fcfa(n).replace(/\s*FCFA$/, '');
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/** Contenu de l'onglet « Séjour » et barre du bas pour une étape côté hôte. */
export function renderOwnerStage(
  res: ReservationDetail,
  stage: OwnerStage,
  h: OwnerHandlers,
  now: Date,
): { content: React.ReactNode; sticky: React.ReactNode | null } {
  const guest = res.locataire;
  const guestName = guest?.prenom ?? 'Le voyageur';
  const photo = res.logement?.photos?.[0]?.url;
  const titre = res.logement?.titre ?? 'Votre logement';
  const nights = plural(res.nbNuits, 'nuit');
  const travellers = plural(res.nbPersonnes, 'voyageur');
  const dates = `${shortDate(res.dateDebut)} → ${shortDate(res.dateFin)}`;
  const payout = hostPayout(res);
  const balance = cashBalance(res);
  const { arrival, departure } = stayHours(res);
  const phoneLocked = !guestPhoneUnlocked(res, now);
  const canCall = !!guest?.telephone && !phoneLocked;
  const kyc = KYC[guest?.statutKyc ?? ''] ?? { label: 'Identité non vérifiée', ok: false };
  const checkinPhotos = (res.photosEtatLieu ?? []).filter((p) => p.type === 'CHECKIN');
  const fees = res.demandesFrais ?? [];

  const guestRow = guest ? (
    <HostRow
      prenom={guest.prenom}
      nom={guest.nom}
      phone={guest.telephone}
      phoneLocked={phoneLocked}
      subtitle={phoneLocked ? `${travellers} · numéro visible le ${shortDate(plus(res.dateDebut, -24 * 3_600_000))}` : `${travellers} · ${kyc.label.toLowerCase()}`}
    />
  ) : null;
  const callBtn = canCall ? (
    <PillButton label="Appeler" variant="ghost" icon={<Phone size={16} color={INK} />} onPress={() => Linking.openURL(`tel:${guest!.telephone}`)} />
  ) : null;
  const balanceCard = balance ? <BalanceCard res={res} balance={balance} guestName={guestName} /> : null;
  // Une fois le voyageur sur place : raccourci vers le litige « Supplément impayé »
  const balanceCardOnSite = balance ? (
    <BalanceCard res={res} balance={balance} guestName={guestName} onReport={() => h.onDispute('NON_PAIEMENT')} />
  ) : null;

  switch (stage) {
    // ── Le voyageur paie ────────────────────────────────────────────────────
    case 'payment-pending':
      return {
        content: (
          <>
            <StayHero photoUrl={photo} chip={<StatusChip label="Paiement en cours" tone="grey" />} title={dates} meta={`${titre} · ${travellers}`} />
            <NowCard label="MAINTENANT · RIEN À FAIRE">
              <NowTitle>{guestName} est en train de payer.</NowTitle>
              <Body>Vous recevrez la demande dès que Paixi confirme son paiement. S’il n’aboutit pas, elle disparaît sans rien vous coûter.</Body>
              <Steps
                items={[
                  { label: `Paiement de ${guestName}`, meta: 'en cours', state: 'current' },
                  { label: 'Votre réponse', meta: 'sous 48 h', state: 'todo' },
                  { label: 'Arrivée validée', state: 'todo' },
                  { label: 'Versement', meta: fcfa(payout), state: 'todo' },
                ]}
              />
            </NowCard>
            {guest && <GuestCard res={res} kycOk={kyc.ok} kycLabel={kyc.label} />}
          </>
        ),
        sticky: null,
      };

    // ── Demande à décider ───────────────────────────────────────────────────
    case 'to-decide': {
      const left = timeLeft(res.delaiConfirmation, now);
      const created = new Date(res.paiement?.confirmeLeWebhook ?? res.creeLe).getTime();
      const deadline = res.delaiConfirmation ? new Date(res.delaiConfirmation).getTime() : created + 48 * 3_600_000;
      const elapsed = Math.min(1, Math.max(0, (now.getTime() - created) / Math.max(1, deadline - created)));
      return {
        content: (
          <>
            <StayHero photoUrl={photo} chip={<StatusChip label="Demande à décider" tone="gold" />} title={`${dates} · ${nights}`} meta={`${titre} · ${travellers}`} />
            <NowCard tone="lime" label="MAINTENANT · ACCEPTER OU REFUSER" aside={left ? `${left} restantes` : undefined}>
              <View style={styles.deadline}>
                <View style={[styles.deadlineFill, { width: `${Math.round(elapsed * 100)}%` }]} />
              </View>
              {guest && <GuestCard res={res} kycOk={kyc.ok} kycLabel={kyc.label} flat />}
              <View style={styles.divider} />
              <Text style={styles.limeLabel}>Vous recevrez</Text>
              <BigAmount amount={amountOnly(payout)} size={38} />
              <Body style={{ color: colors.forest[800] }}>
                {balance
                  ? `Via Paixi, à l’arrivée de ${guestName}. Plus ${fcfa(balance)} de solde à encaisser sur place.`
                  : `Déjà payé par ${guestName} et bloqué chez Paixi. Versé dès qu’il valide son arrivée.`}
              </Body>
            </NowCard>
            <InfoNote tone="white" icon={<Clock size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
              Sans réponse {res.delaiConfirmation ? `avant le ${shortDate(res.delaiConfirmation)} à ${clock(res.delaiConfirmation)}` : 'à temps'}, la demande expire et {guestName} est remboursé.
            </InfoNote>
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label="Refuser" variant="ghost" onPress={h.onRefuse} />
            <PillButton label="Accepter" flex={2} onPress={h.onAccept} />
          </StickyBar>
        ),
      };
    }

    // ── Confirmée, avant l'ouverture de l'état des lieux ────────────────────
    case 'confirmed': {
      const opens = plus(res.dateDebut, -CHECKIN_WINDOW_MS);
      const unlock = plus(res.dateDebut, -24 * 3_600_000);
      const days = Math.max(1, Math.ceil((new Date(res.dateDebut).getTime() - now.getTime()) / 86_400_000));
      return {
        content: (
          <>
            <StayHero photoUrl={photo} chip={<StatusChip label="Confirmée" tone="lime" />} title={`Arrivée ${longDate(res.dateDebut)}`} meta={`${arrival} → ${longDate(res.dateFin)} ${departure} · ${nights}`} />
            <NowCard label="MAINTENANT · PRÉPARER L’ARRIVÉE" aside={`J-${days}`}>
              <NowTitle>Tout est prêt pour {guestName}.</NowTitle>
              <Steps
                items={[
                  { label: 'Adresse et horaires envoyés', meta: res.confirmeeLe ? shortDate(res.confirmeeLe) : undefined, state: 'done' },
                  { label: 'Numéros échangés', meta: phoneLocked ? `${shortDate(unlock)} · ${clock(unlock)}` : 'fait', state: phoneLocked ? 'todo' : 'done' },
                  { label: 'État des lieux d’entrée', meta: `${shortDate(opens)} · dès ${clock(opens)}`, state: 'todo' },
                  { label: `${guestName} valide, vous êtes payé`, state: 'todo' },
                ]}
              />
            </NowCard>
            {guestRow}
            {balanceCard}
            <EscrowLine text={<><Text style={styles.bold}>{fcfa(payout)} bloqués pour vous</Text> · versés à l’arrivée de {guestName}</>} />
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label="Annuler" variant="dangerGhost" onPress={h.onCancel} />
            <PillButton label={`État des lieux · ${clock(opens)}`} flex={1.8} disabled icon={<Lock size={15} color={colors.lime[400]} />} onPress={() => {}} />
          </StickyBar>
        ),
      };
    }

    // ── Jour J : faire l'état des lieux d'entrée ────────────────────────────
    case 'checkin-open':
      return {
        content: (
          <>
            <StageHeadline chip={<StatusChip label={`Arrivée aujourd’hui · ${arrival}`} tone="ink" />} line1="Photographiez" line2="avant l’arrivée." />
            <NowCard tone="lime" label="MAINTENANT · ÉTAT DES LIEUX D’ENTRÉE">
              <Body style={{ color: colors.forest[800] }}>
                Une photo suffit pour démarrer, mais chaque pièce compte : en cas de litige, Paixi s’y réfère en premier.
              </Body>
              <View style={styles.rooms}>
                {['Entrée', 'Salon', 'Chambre', 'Cuisine', 'Salle de bain'].map((r) => (
                  <View key={r} style={styles.room}>
                    <Camera size={13} color={INK} />
                    <Text style={styles.roomText}>{r}</Text>
                  </View>
                ))}
              </View>
              <Steps
                items={[
                  { label: 'Vous photographiez le logement', state: 'current' },
                  { label: `${guestName} vérifie sur place`, state: 'todo' },
                  { label: 'Paixi vous verse', meta: fcfa(payout), state: 'todo' },
                ]}
              />
            </NowCard>
            {guestRow}
            {balanceCard}
          </>
        ),
        sticky: (
          <StickyBar>
            {callBtn}
            <PillButton label="Faire l’état des lieux" flex={2} icon={<Camera size={16} color={colors.lime[400]} />} onPress={h.onCheckinCamera} />
          </StickyBar>
        ),
      };

    // ── Le voyageur a signalé l'absence de l'hôte ───────────────────────────
    case 'host-absent-reported': {
      const deadline = plus(res.absenceSignaleeLe!, HOST_ABSENCE_GRACE_MS);
      const left = timeLeft(deadline, now);
      return {
        content: (
          <>
            <StageHeadline chip={<StatusChip label="Absence signalée" tone="red" />} line1={`${guestName} vous attend.`} line2="Faites l’état des lieux." />
            <NowCard tone="gold" label="URGENT" aside={left ? `encore ${left}` : 'délai dépassé'}>
              <NowTitle>{guestName} a signalé votre absence à {clock(res.absenceSignaleeLe!)}.</NowTitle>
              <Body>
                Sans état des lieux d’entrée avant {clock(deadline)}, la réservation est annulée et {guestName} est remboursé intégralement.
              </Body>
            </NowCard>
            {guestRow}
          </>
        ),
        sticky: (
          <StickyBar>
            {callBtn}
            <PillButton label="Faire l’état des lieux" flex={2} icon={<Camera size={16} color={colors.lime[400]} />} onPress={h.onCheckinCamera} />
          </StickyBar>
        ),
      };
    }

    // ── Entrée envoyée, le voyageur doit valider ────────────────────────────
    case 'awaiting-guest': {
      const auto = autoCheckinAt(res)!;
      const noshowFrom = plus(res.dateDebut, NOSHOW_AFTER_MS);
      return {
        content: (
          <>
            <StayHero
              photoUrl={photo}
              chip={<StatusChip label="Entrée envoyée" tone="gold" />}
              title={`${guestName} doit valider`}
              meta={`Envoyée à ${clock(res.checkinProprioLe!)} · ${plural(checkinPhotos.length, 'photo')}`}
            />
            <NowCard tone="gold" label={`MAINTENANT · ATTENDRE ${guestName.toUpperCase()}`}>
              <NowTitle>{guestName} vérifie le logement en arrivant.</NowTitle>
              <Body>
                Dès qu’il valide, {fcfa(payout)} arrivent sur votre portefeuille. Sans réponse, Paixi valide pour lui à {clock(auto)}.
              </Body>
              <Steps
                items={[
                  { label: 'Votre état des lieux', meta: clock(res.checkinProprioLe!), state: 'done' },
                  { label: `${guestName} valide son arrivée`, meta: `prévue ${arrival}`, state: 'current' },
                  { label: 'Paixi vous verse', meta: fcfa(payout), state: 'todo' },
                ]}
              />
            </NowCard>
            {checkinPhotos.length > 0 && <PhotoStrip photos={checkinPhotos} onPress={() => h.onGallery('CHECKIN')} />}
            {guestRow}
            {balanceCardOnSite}
            <InfoNote tone="white" icon={<Clock size={15} color={colors.neutral[600]} strokeWidth={2.2} />}>
              {guestName} n’est toujours pas là à {clock(noshowFrom)} ? Vous pourrez signaler son absence ici.
            </InfoNote>
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label="Mes photos" variant="ghost" icon={<Camera size={16} color={INK} />} onPress={() => h.onGallery('CHECKIN')} />
            {canCall ? (
              <PillButton label={`Appeler ${guestName}`} flex={1.6} icon={<Phone size={16} color={colors.lime[400]} />} onPress={() => Linking.openURL(`tel:${guest!.telephone}`)} />
            ) : null}
          </StickyBar>
        ),
      };
    }

    // ── Voyageur en retard : joindre puis signaler ──────────────────────────
    case 'guest-late': {
      const lateMin = Math.max(0, Math.round((now.getTime() - new Date(res.dateDebut).getTime()) / 60_000));
      return {
        content: (
          <>
            <StageHeadline chip={<StatusChip label="Retard" tone="red" />} line1={`${guestName} n’est pas`} line2="encore arrivé." />
            <View style={styles.lateCard}>
              <LateCell label="PRÉVU" value={clock(res.dateDebut)} />
              <LateCell label="MAINTENANT" value={clock(now.toISOString())} />
              <LateCell label="RETARD" value={`${Math.floor(lateMin / 60)} h ${String(lateMin % 60).padStart(2, '0')}`} alert />
            </View>
            <NowCard>
              <NowTitle>Avant de signaler, essayez de le joindre.</NowTitle>
              <Body>
                Le no-show prévient {guestName} immédiatement. Sans validation de son arrivée, le séjour est clôturé en non-présentation.
              </Body>
              <InfoNote icon={<Clock size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
                {res.checkinProprioLe
                  ? `Sans signalement de votre part, Paixi démarre le séjour automatiquement à ${clock(autoCheckinAt(res)!)}.`
                  : 'Sans état des lieux d’entrée de votre part, le séjour ne démarre pas et vous n’êtes pas payé.'}
              </InfoNote>
              {!res.checkinProprioLe && (
                <InfoNote icon={<Camera size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
                  Vous n’avez pas encore fait l’état des lieux d’entrée : faites-le si {guestName} arrive.
                </InfoNote>
              )}
            </NowCard>
            {guestRow}
          </>
        ),
        sticky: (
          <StickyBar>
            {callBtn ?? (!res.checkinProprioLe ? <PillButton label="État des lieux" variant="ghost" onPress={h.onCheckinCamera} /> : null)}
            <PillButton label="Signaler un no-show" variant="danger" flex={1.6} icon={<AlertTriangle size={16} color={colors.neutral[0]} />} onPress={h.onNoshow} />
          </StickyBar>
        ),
      };
    }

    // ── No-show signalé, clôture imminente ──────────────────────────────────
    case 'noshow-signaled': {
      const signaled = noshowSignaledAt(res)!;
      const closesAt = plus(signaled, NOSHOW_CLOSE_MS);
      return {
        content: (
          <>
            <StageHeadline chip={<StatusChip label="No-show signalé" tone="red" />} line1="Absence signalée" line2={`à ${clock(signaled)}.`} />
            <NowCard label="MAINTENANT · DERNIÈRE CHANCE POUR LE VOYAGEUR" aside={timeLeft(closesAt, now) ?? 'clôture en cours'}>
              <NowTitle>{guestName} est prévenu.</NowTitle>
              <Body>
                S’il arrive, demandez-lui de valider son arrivée dans l’app : le séjour reprend normalement. Sinon, il est clôturé en no-show vers {clock(closesAt)}.
              </Body>
              <Body>Même après la clôture, vous pourrez rouvrir son arrivée depuis cet écran.</Body>
            </NowCard>
            {guestRow}
          </>
        ),
        sticky: callBtn ? <StickyBar>{callBtn}</StickyBar> : null,
      };
    }

    // ── Clôturée en no-show ─────────────────────────────────────────────────
    case 'noshow-closed':
      return {
        content: (
          <>
            <StayHero photoUrl={photo} chip={<StatusChip label="No-show" tone="grey" />} title="Clôturée en non-présentation" meta={`${dates} · ${titre}`} dimmed />
            <NowCard label="CE QUI S’EST PASSÉ">
              <NowTitle>{guestName} ne s’est pas présenté.</NowTitle>
              <Body>
                Vous avez signalé son absence{noshowSignaledAt(res) ? ` à ${clock(noshowSignaledAt(res)!)}` : ''}, puis Paixi a clôturé la réservation{res.closeLe ? ` à ${clock(res.closeLe)}` : ''}.
              </Body>
            </NowCard>
            <InfoNote tone="white" icon={<RotateCcw size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
              {guestName} est finalement là ? Rouvrez son arrivée : le séjour reprend comme si de rien n’était.
            </InfoNote>
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label="Une question" variant="ghost" onPress={h.onSupport} />
            <PillButton
              label="Rouvrir l’arrivée"
              flex={1.6}
              loading={h.actions.pending === 'reopen'}
              icon={<RotateCcw size={16} color={colors.lime[400]} />}
              onPress={() =>
                Alert.alert('Rouvrir l’arrivée ?', `${guestName} est sur place : le séjour reprend normalement.`, [
                  { text: 'Retour', style: 'cancel' },
                  { text: 'Rouvrir', onPress: () => h.actions.reopen() },
                ])
              }
            />
          </StickyBar>
        ),
      };

    // ── Séjour en cours ─────────────────────────────────────────────────────
    case 'in-stay': {
      const start = new Date(res.dateDebut).getTime();
      const night = Math.min(res.nbNuits, Math.max(1, Math.floor((now.getTime() - start) / 86_400_000) + 1));
      const exitOpens = plus(res.dateFin, -CHECKOUT_WINDOW_MS);
      return {
        content: (
          <>
            <StayHero
              photoUrl={photo}
              chip={<StatusChip label={`En cours · nuit ${night} sur ${res.nbNuits}`} tone="lime" />}
              title={`Départ ${longDate(res.dateFin)}`}
              meta={`à ${departure} · ${titre}`}
            />
            <PayoutCard res={res} payout={payout} onWallet={h.onWallet} />
            {balanceCardOnSite}
            <FeesCard fees={fees} actions={h.actions} onAdd={h.onFee} />
            <NowCard label="LE DÉPART">
              <Steps
                items={[
                  { label: 'État des lieux de sortie', meta: `${shortDate(exitOpens)} · dès ${clock(exitOpens)}`, state: 'todo' },
                  { label: 'Clôture du séjour', meta: `${shortDate(res.dateFin)} · ${departure}`, state: 'todo' },
                ]}
              />
              <TouchableOpacity onPress={() => h.onDispute('DEPASSEMENT_PERSONNES')} style={styles.linkRow} accessibilityRole="button">
                <Text style={styles.small}>Plus de {travellers} sur place ?</Text>
                <Text style={styles.link}>Signaler ›</Text>
              </TouchableOpacity>
            </NowCard>
            {guestRow}
          </>
        ),
        sticky: (
          <StickyBar>
            {callBtn}
            <PillButton label="Supplément" flex={callBtn ? 1.3 : 1} icon={<Plus size={16} color={colors.lime[400]} />} onPress={h.onFee} />
          </StickyBar>
        ),
      };
    }

    // ── Jour du départ ──────────────────────────────────────────────────────
    case 'departure': {
      const done = !!res.checkoutProprioLe;
      const closeWithoutPhotos = () =>
        Alert.alert('Clôturer sans photos ?', 'Sans état des lieux de sortie, un litige éventuel sera plus difficile à prouver.', [
          { text: 'Retour', style: 'cancel' },
          { text: 'Clôturer', onPress: () => h.actions.complete() },
        ]);
      return {
        content: (
          <>
            <StageHeadline
              chip={<StatusChip label={`Départ · ${departure}`} tone={done ? 'lime' : 'gold'} />}
              line1={done ? 'Sortie enregistrée.' : 'Comparez avec'}
              line2={done ? 'Il ne reste qu’à clôturer.' : 'l’entrée.'}
            />
            {done ? (
              <NowCard tone="lime" label="MAINTENANT · CLÔTURER">
                <Body style={{ color: colors.forest[800] }}>
                  Tout est en ordre ? Clôturez le séjour. Un problème ? Ouvrez un litige, vos photos d’entrée et de sortie sont jointes automatiquement.
                </Body>
              </NowCard>
            ) : (
              <NowCard tone="lime" label="MAINTENANT · ÉTAT DES LIEUX DE SORTIE">
                <Body style={{ color: colors.forest[800] }}>
                  Photographiez les mêmes pièces qu’à l’entrée. Tout va bien ? Vous pouvez aussi clôturer directement.
                </Body>
                {checkinPhotos.length > 0 && <PhotoStrip photos={checkinPhotos} onPress={() => h.onGallery('CHECKIN')} caption="Vos photos d’entrée" />}
              </NowCard>
            )}
            {balanceCardOnSite}
            <FeesCard fees={fees} actions={h.actions} onAdd={h.onFee} />
            {guestRow}
          </>
        ),
        sticky: done ? (
          <StickyBar>
            <PillButton label="Un problème" variant="ghost" onPress={() => h.onDispute()} />
            <PillButton label="Clôturer le séjour" flex={1.6} loading={h.actions.pending === 'complete'} onPress={() => h.actions.complete()} />
          </StickyBar>
        ) : (
          <StickyBar>
            <PillButton label="Clôturer" variant="ghost" loading={h.actions.pending === 'complete'} onPress={closeWithoutPhotos} />
            <PillButton label="État des lieux" flex={1.6} icon={<Camera size={16} color={colors.lime[400]} />} onPress={h.onCheckoutCamera} />
          </StickyBar>
        ),
      };
    }

    // ── Terminé : gains, avis, fenêtre de litige ────────────────────────────
    case 'completed': {
      const mine = (res.avis ?? []).find((a) => a.auteurId === h.currentUserId);
      const theirs = (res.avis ?? []).find((a) => a.auteurId === guest?.id);
      const daysLeft = reviewDaysLeft(res, now);
      const paidFees = fees.filter((f) => f.statut === 'PAYE');
      const feesTotal = paidFees.reduce((s, f) => s + Number(f.montant), 0);
      const canDispute = disputeOpen(res, now);
      return {
        content: (
          <>
            <StayHero photoUrl={photo} chip={<StatusChip label="Terminé" tone="grey" />} title="Séjour clôturé" meta={`${dates}${res.closeLe ? ` · le ${shortDate(res.closeLe)}` : ''}`} />
            <LitigeOutcome res={res} />
            <NowCard label="VOUS AVEZ GAGNÉ">
              <BigAmount amount={amountOnly(payout + feesTotal)} size={34} />
              <Line label={nights} value={amountOnly(payout)} />
              {paidFees.map((f) => <Line key={f.id} label={f.titre} value={amountOnly(f.montant)} />)}
              {balance ? <Line label="Solde réglé sur place" value={amountOnly(balance)} /> : null}
            </NowCard>
            {mine ? (
              <ReviewLine title="Votre avis" note={mine.note} text={mine.commentaire} />
            ) : daysLeft !== null ? (
              <RateCard guestName={guestName} daysLeft={daysLeft} actions={h.actions} />
            ) : null}
            {theirs && <ReviewLine title={`L’avis de ${guestName}`} note={theirs.note} text={theirs.commentaire} />}
            {canDispute && res.closeLe && (
              <InfoNote tone="white" icon={<ShieldCheck size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
                Un dégât découvert après coup ? Vous avez jusqu’au {shortDate(plus(res.closeLe, DISPUTE_WINDOW_MS))} à {clock(plus(res.closeLe, DISPUTE_WINDOW_MS))} pour ouvrir un litige.
              </InfoNote>
            )}
          </>
        ),
        sticky: (
          <StickyBar>
            {canDispute && <PillButton label="Un problème" variant="ghost" onPress={() => h.onDispute()} />}
            <PillButton label="Voir le dossier" variant={canDispute ? 'ink' : 'ghost'} flex={canDispute ? 1.4 : 1} onPress={h.onDossier} />
          </StickyBar>
        ),
      };
    }

    // ── Litige en cours ─────────────────────────────────────────────────────
    case 'disputed': {
      const l = res.litige;
      const byGuest = l?.declarePar === 'LOCATAIRE';
      return {
        content: (
          <>
            <StageHeadline
              chip={<StatusChip label="Litige en cours" tone="red" />}
              line1={byGuest ? `${guestName} a ouvert` : 'Votre litige'}
              line2={byGuest ? 'un litige.' : 'est en examen.'}
            />
            {l && (
              <NowCard label={byGuest ? 'MAINTENANT · DONNER VOTRE VERSION' : 'MAINTENANT · L’ÉQUIPE PAIXI EXAMINE'}>
                <View style={styles.motif}>
                  <Text style={styles.motifText}>{DISPUTE_LABELS[l.motif] ?? l.motif}</Text>
                </View>
                {l.description ? <Text style={styles.quote}>« {l.description} »</Text> : null}
                <Steps
                  items={[
                    { label: byGuest ? `Ouvert par ${guestName}` : 'Ouvert par vous', meta: `${shortDate(l.creeLe)} · ${clock(l.creeLe)}`, state: 'done' },
                    { label: byGuest ? 'Votre version' : `Réponse de ${guestName}`, meta: 'texte et photos', state: 'current' },
                    { label: 'Décision de Paixi', meta: 'fondé ou non fondé', state: 'todo' },
                  ]}
                />
              </NowCard>
            )}
            {checkinPhotos.length > 0 && <PhotoStrip photos={checkinPhotos} onPress={() => h.onGallery('CHECKIN')} caption="Vos photos d’entrée sont jointes" />}
            <InfoNote tone="white" icon={<Lock size={15} color={colors.neutral[600]} strokeWidth={2.2} />}>
              Vos retraits en attente sont suspendus le temps de l’examen, par précaution.
            </InfoNote>
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label={byGuest ? 'Donner ma version' : 'Ajouter des éléments'} onPress={h.onSupport} />
          </StickyBar>
        ),
      };
    }

    // ── Annulée ─────────────────────────────────────────────────────────────
    case 'cancelled': {
      const p = res.politiqueAppliquee ?? '';
      const refused = p === 'UC3_PROPRIO_REFUSE' || (!res.confirmeeLe && p.startsWith('UC4'));
      const byHost = p.startsWith('UC4') || p === 'UC3_PROPRIO_REFUSE';
      const byGuest = p.startsWith('UC1') || p.startsWith('UC2');
      const hostAbsent = p === 'ABSENCE_PROPRIO';
      const refund = res.refunds?.[0];
      const cancelEvent = (res.historique ?? []).find((e) => e.nouveauStatut === 'CANCELLED');
      const penalty = Number(cancelEvent?.metadonnees?.penaliteProprio ?? 0);
      const title = refused ? 'Vous avez refusé' : byHost ? 'Vous avez annulé' : byGuest ? `${guestName} a annulé` : hostAbsent ? 'Annulée pour absence' : 'Réservation annulée';
      return {
        content: (
          <>
            <StayHero photoUrl={photo} chip={<StatusChip label={refused ? 'Refusée' : 'Annulée'} tone="red" />} title={title} meta={`${dates}${res.annuleLe ? ` · le ${shortDate(res.annuleLe)}` : ''}`} dimmed />
            <NowCard label="CE QUI S’EST PASSÉ">
              <NowTitle>
                {hostAbsent
                  ? `L’état des lieux n’a pas été fait après le signalement de ${guestName}.`
                  : byGuest
                    ? `${guestName} a annulé son séjour.`
                    : refused
                      ? 'Vous avez refusé la demande, sans pénalité.'
                      : 'Vous avez annulé la réservation.'}
              </NowTitle>
              {res.raisonAnnulation ? <Text style={styles.quote}>« {res.raisonAnnulation} »</Text> : null}
              {refund && (
                <Line label={`Remboursé à ${guestName}`} value={`${amountOnly(refund.montantLocataire)} FCFA`} />
              )}
              {byHost && !refused && (penalty > 0 ? (
                <>
                  <Line label="Pénalité d’annulation" value={`− ${amountOnly(penalty)} FCFA`} />
                  <Body>Déduite de votre portefeuille, ou de votre prochain versement si le solde ne suffit pas.</Body>
                </>
              ) : (
                <Body>Annulée plus de 3 jours avant l’arrivée : aucune pénalité.</Body>
              ))}
            </NowCard>
            <InfoNote tone="white" icon={<Calendar size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
              Vos dates du {shortDate(res.dateDebut)} au {shortDate(res.dateFin)} sont de nouveau réservables.
            </InfoNote>
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label="Ouvrir le calendrier" variant="ghost" icon={<Calendar size={16} color={INK} />} onPress={h.onCalendar} />
          </StickyBar>
        ),
      };
    }

    // ── Expirée faute de réponse ────────────────────────────────────────────
    case 'expired':
      return {
        content: (
          <>
            <StayHero photoUrl={photo} chip={<StatusChip label="Expirée" tone="grey" />} title="Demande non traitée" meta={`${dates}${res.delaiConfirmation ? ` · expirée le ${shortDate(res.delaiConfirmation)}` : ''}`} dimmed />
            <NowCard label="CE QUI S’EST PASSÉ">
              <NowTitle>Vous n’avez pas répondu à temps.</NowTitle>
              <Body>La demande a expiré et {guestName} a été remboursé intégralement. Aucune pénalité pour vous.</Body>
            </NowCard>
            <InfoNote tone="white" icon={<AlertTriangle size={15} color={colors.gold[700]} strokeWidth={2.2} />}>
              Activez les notifications pour ne plus manquer une demande : vous avez en général 48 h pour répondre.
            </InfoNote>
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label="Ouvrir le calendrier" variant="ghost" icon={<Calendar size={16} color={INK} />} onPress={h.onCalendar} />
          </StickyBar>
        ),
      };
  }
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function GuestCard({ res, kycOk, kycLabel, flat }: { res: ReservationDetail; kycOk: boolean; kycLabel: string; flat?: boolean }) {
  const g = res.locataire!;
  const initials = `${g.prenom.charAt(0)}${g.nom?.charAt(0) ?? ''}`.toUpperCase();
  return (
    <View style={[styles.guest, !flat && styles.guestCard]}>
      <View style={styles.guestTop}>
        {g.avatarUrl ? (
          <Image source={{ uri: g.avatarUrl }} style={styles.guestAvatar} contentFit="cover" />
        ) : (
          <View style={styles.guestAvatar}>
            <Text style={styles.guestInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.flex}>
          <Text style={styles.guestName}>
            {g.prenom} {g.nom ? `${g.nom.charAt(0)}.` : ''}
          </Text>
          <Text style={styles.small}>{plural(res.nbPersonnes, 'voyageur')} · {plural(res.nbNuits, 'nuit')}</Text>
        </View>
      </View>
      <View style={styles.badges}>
        <View style={[styles.badge, !kycOk && styles.badgeWarn]}>
          {kycOk ? <Check size={12} color={INK} strokeWidth={3} /> : <AlertTriangle size={12} color={colors.gold[700]} strokeWidth={2.4} />}
          <Text style={[styles.badgeText, !kycOk && { color: colors.gold[700] }]}>{kycLabel}</Text>
        </View>
        {g.telephone ? (
          <View style={styles.badge}>
            <Check size={12} color={INK} strokeWidth={3} />
            <Text style={styles.badgeText}>Téléphone renseigné</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PayoutCard({ res, payout, onWallet }: { res: ReservationDetail; payout: number; onWallet: () => void }) {
  return (
    <NowCard tone="dark" label="VERSÉ · VOTRE ARGENT">
      <BigAmount amount={amountOnly(payout)} light size={36} />
      <Body light>
        Sur votre portefeuille{res.checkinLocataireLe ? ` depuis le ${shortDate(res.checkinLocataireLe)} à ${clock(res.checkinLocataireLe)}` : ''}.
      </Body>
      <TouchableOpacity onPress={() => { tap(); onWallet(); }} style={styles.walletBtn} accessibilityRole="button">
        <Wallet size={16} color={colors.lime[400]} />
        <Text style={styles.walletText}>Ouvrir mon portefeuille</Text>
        <Text style={styles.walletChevron}>›</Text>
      </TouchableOpacity>
    </NowCard>
  );
}

function BalanceCard({ res, balance, guestName, onReport }: { res: ReservationDetail; balance: number; guestName: string; onReport?: () => void }) {
  const deposit = Number(res.montantAcompte ?? 0);
  const total = deposit + balance;
  return (
    <NowCard tone="gold" label="SOLDE À ENCAISSER SUR PLACE">
      <BigAmount amount={amountOnly(balance)} size={30} />
      <View style={styles.split}>
        <View style={[styles.splitFill, { width: `${Math.round((deposit / Math.max(1, total)) * 100)}%` }]} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.small}><Text style={styles.bold}>{amountOnly(deposit)}</Text> d’acompte via Paixi</Text>
        <Text style={styles.small}>Total {amountOnly(total)}</Text>
      </View>
      <Body>{guestName} vous règle ce solde à son arrivée, en espèces ou par mobile money. Remettez-lui un reçu.</Body>
      {onReport && (
        <TouchableOpacity onPress={() => { tap(); onReport(); }} style={styles.linkRow} accessibilityRole="button">
          <Text style={styles.small}>Le solde n’a pas été réglé ?</Text>
          <Text style={[styles.link, { color: colors.error[700] }]}>Signaler ›</Text>
        </TouchableOpacity>
      )}
    </NowCard>
  );
}

function FeesCard({ fees, actions, onAdd }: { fees: DemandeFraisReservation[]; actions: OwnerActions; onAdd: () => void }) {
  return (
    <NowCard label="SUPPLÉMENTS" aside={fees.length ? plural(fees.length, 'demande') : undefined}>
      {fees.map((f) => {
        const st = FEE_STATUS[f.statut] ?? { label: f.statut, color: colors.neutral[600] };
        return (
          <View key={f.id} style={styles.fee}>
            <View style={styles.feeIcon}>
              <Banknote size={16} color={colors.forest[600]} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.feeTitle} numberOfLines={1}>{f.titre}</Text>
              <Text style={[styles.small, { color: st.color }]}>
                {st.label}
                {f.statut === 'PAYE' && f.methodePaiement ? ` · ${f.methodePaiement === 'LIQUIDE' || f.methodePaiement === 'ESPECES' ? 'espèces' : f.methodePaiement.replace('_', ' ').toLowerCase()}` : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.feeAmount}>{amountOnly(f.montant)}</Text>
              {f.statut === 'EN_ATTENTE' && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Encaissé en espèces ?', `${f.titre} sera marqué comme payé.`, [
                      { text: 'Retour', style: 'cancel' },
                      { text: 'Confirmer', onPress: () => actions.markFeeCash(f.id) },
                    ])
                  }
                  hitSlop={6}
                >
                  <Text style={styles.link}>Reçu en espèces</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
      <TouchableOpacity onPress={() => { tap(); onAdd(); }} style={styles.addRow} accessibilityRole="button">
        <View style={styles.addIcon}>
          <Plus size={16} color={INK} strokeWidth={2.4} />
        </View>
        <Text style={styles.addText}>Demander un supplément</Text>
      </TouchableOpacity>
    </NowCard>
  );
}

function PhotoStrip({ photos, onPress, caption }: { photos: Array<{ url: string }>; onPress: () => void; caption?: string }) {
  const shown = photos.slice(0, 3);
  const more = photos.length - shown.length;
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} style={styles.strip} accessibilityRole="button" accessibilityLabel="Voir les photos">
      {shown.map((p, i) => (
        <Image key={i} source={{ uri: p.url }} style={styles.stripPhoto} contentFit="cover" />
      ))}
      <View style={[styles.stripPhoto, styles.stripMore]}>
        <Text style={styles.stripMoreText}>{more > 0 ? `+${more}` : 'Voir'}</Text>
      </View>
      {caption ? <Text style={styles.stripCaption}>{caption}</Text> : null}
    </TouchableOpacity>
  );
}

function RateCard({ guestName, daysLeft, actions }: { guestName: string; daysLeft: number; actions: OwnerActions }) {
  const [note, setNote] = React.useState(0);
  const [comment, setComment] = React.useState('');
  return (
    <NowCard tone="lime" label={`À FAIRE · NOTER ${guestName.toUpperCase()}`} aside={`encore ${plural(daysLeft, 'jour')}`}>
      <NowTitle>Comment s’est passé ce séjour ?</NowTitle>
      <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`${note} étoiles sur 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <TouchableOpacity key={i} onPress={() => { tap(); setNote(i + 1); }} hitSlop={4}>
            <Star size={38} color={INK} fill={i < note ? INK : 'transparent'} strokeWidth={1.6} />
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        placeholder="Un mot pour les prochains hôtes (facultatif)"
        placeholderTextColor={colors.forest[800]}
        style={styles.reviewInput}
        accessibilityLabel="Commentaire"
      />
      <PillButton label="Publier l’avis" disabled={note === 0} loading={actions.pending === 'rate'} onPress={() => actions.rateGuest(note, comment)} />
    </NowCard>
  );
}

function ReviewLine({ title, note, text }: { title: string; note: number; text?: string | null }) {
  return (
    <View style={styles.review}>
      <View style={styles.rowBetween}>
        <Text style={styles.feeTitle}>{title}</Text>
        <View style={styles.starsSmall}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={14} color={colors.gold[400]} fill={i < note ? colors.gold[400] : 'transparent'} strokeWidth={1.8} />
          ))}
        </View>
      </View>
      {text ? <Text style={styles.small}>« {text} »</Text> : null}
    </View>
  );
}

/** Décision rendue sur un litige, vue par l'hôte. */
function LitigeOutcome({ res }: { res: ReservationDetail }) {
  const l = res.litige;
  if (!l || l.statut === 'EN_ATTENTE') return null;
  const fonde = l.statut === 'FONDE';
  const forHost = fonde ? l.declarePar !== 'LOCATAIRE' : l.declarePar === 'LOCATAIRE';
  const compensation = l.montantCompensation ? Number(l.montantCompensation) : 0;
  return (
    <NowCard tone="dark" label={`DÉCISION DE PAIXI${l.resoluLe ? ` · ${shortDate(l.resoluLe)}` : ''}`}>
      <NowTitle light>{forHost ? 'Litige tranché en votre faveur.' : `Litige tranché en faveur du voyageur.`}</NowTitle>
      {compensation > 0 && <BigAmount amount={amountOnly(compensation)} light size={30} />}
      {l.decisionAdmin ? <Body light>« {l.decisionAdmin} »</Body> : null}
    </NowCard>
  );
}

function EscrowLine({ text }: { text: React.ReactNode }) {
  return (
    <View style={styles.escrowLine}>
      <Lock size={14} color={colors.forest[600]} strokeWidth={2.2} />
      <Text style={[styles.small, styles.flex]}>{text}</Text>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

function LateCell({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <View style={styles.lateCell}>
      <Text style={styles.lateLabel}>{label}</Text>
      <Text style={[styles.lateValue, alert && { color: '#F5A99D' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  small: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[600] },
  bold: { fontFamily: typography.fontBodyBold, color: INK },
  link: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.link },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  quote: { fontFamily: typography.fontBody, fontSize: 14, lineHeight: 21, color: INK },
  divider: { height: 1.5, backgroundColor: 'rgba(4,25,18,0.12)' },
  limeLabel: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.forest[800], marginBottom: -6 },

  deadline: { height: 6, borderRadius: 3, backgroundColor: 'rgba(4,25,18,0.12)', overflow: 'hidden' },
  deadlineFill: { height: 6, backgroundColor: INK },

  guest: { gap: 12 },
  guestCard: { padding: 14, borderRadius: 22, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  guestTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  guestInitials: { fontFamily: typography.fontBodyBold, fontSize: 17, color: colors.lime[400] },
  guestName: { fontFamily: typography.fontBodyBold, fontSize: 17, color: INK },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(4,25,18,0.08)' },
  badgeWarn: { backgroundColor: colors.gold[50] },
  badgeText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: INK },

  rooms: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  room: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(4,25,18,0.08)' },
  roomText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: INK },

  lateCard: { flexDirection: 'row', padding: 16, borderRadius: 24, backgroundColor: INK },
  lateCell: { flex: 1, alignItems: 'center' },
  lateLabel: { fontFamily: typography.fontBodyBold, fontSize: 10, color: colors.forest[200] },
  lateValue: { marginTop: 2, fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: PAPER },

  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(248,251,244,0.08)' },
  walletText: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 14, color: PAPER },
  walletChevron: { fontFamily: typography.fontBodyBold, fontSize: 18, color: colors.forest[300] },

  split: { height: 10, borderRadius: 5, backgroundColor: 'rgba(4,25,18,0.1)', overflow: 'hidden' },
  splitFill: { height: 10, backgroundColor: INK },

  fee: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  feeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.forest[50], alignItems: 'center', justifyContent: 'center' },
  feeTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  feeAmount: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK, fontVariant: ['tabular-nums'] },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  addIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: INK },

  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stripPhoto: { width: 74, height: 74, borderRadius: 16 },
  stripMore: { backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  stripMoreText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: PAPER },
  stripCaption: { width: '100%', fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },

  motif: { alignSelf: 'flex-start', height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.error[50], justifyContent: 'center' },
  motifText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.error[700] },

  stars: { flexDirection: 'row', gap: 8 },
  starsSmall: { flexDirection: 'row', gap: 2 },
  reviewInput: {
    minHeight: 64,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    fontFamily: typography.fontBody,
    fontSize: 14,
    color: INK,
    textAlignVertical: 'top',
  },
  review: { gap: 6, padding: 14, borderRadius: 20, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },

  escrowLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  lineLabel: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  lineValue: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: INK, fontVariant: ['tabular-nums'] },
});
