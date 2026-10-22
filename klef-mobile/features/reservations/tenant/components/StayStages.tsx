import React from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { router, useRouter } from 'expo-router';
import {
  AlertTriangle,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Copy,
  LifeBuoy,
  Lock,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react-native';
import { colors, typography } from '../../../../shared/theme/tokens';
import { formatFCFA } from '../../../owner-home/lib/format';
import { WeekendStrip, useWeekendPicks } from '../../../booking/components/WeekendPicks';
import type { DemandeFraisReservation, ReservationDetail } from '../../types/reservation-detail.types';
import type { TenantActions } from '../hooks/useTenantActions';
import {
  clock,
  balanceDue,
  depositSplit,
  escrowAmount,
  isDeposit,
  hostPhoneUnlocked,
  reviewDaysLeft,
  stayHours,
  longDate,
  shortDate,
  timeLeft,
  type TenantStage,
} from '../lib/stage';
import {
  BigAmount,
  Body,
  EscrowTrack,
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
} from './ui';

export interface StageHandlers {
  actions: TenantActions;
  currentUserId?: string;
  onCancel: () => void;
  onGallery: (type: 'CHECKIN' | 'CHECKOUT') => void;
  onWelcomeGuide: () => void;
  onRefuse: () => void;
  onReportProblem: () => void;
  onFee: (fee: DemandeFraisReservation, mode: 'contest') => void;
  onDossier: () => void;
  onSupport: () => void;
}

const POLICY_LABELS: Record<string, string> = {
  UC1_LOCATAIRE_NON_CONFIRMEE: 'Avant confirmation de l’hôte',
  UC2_LOCATAIRE_PLUS_3J: 'Plus de 3 jours avant l’arrivée',
  UC2_LOCATAIRE_1_3J: 'Entre 24 h et 3 jours avant · 75 %',
  UC2_LOCATAIRE_BLOQUE: 'Moins de 24 h avant · 50 %',
  UC3_PROPRIO_REFUSE: 'Refusée par l’hôte · intégral',
  UC4_PROPRIO_PLUS_7J: 'Annulée par l’hôte · intégral',
  UC4_PROPRIO_3_7J: 'Annulée par l’hôte · intégral',
  UC4_PROPRIO_MOINS_3J: 'Annulée par l’hôte · intégral',
  UC4_PROPRIO_JOUR_MEME: 'Annulée par l’hôte · intégral',
  ABSENCE_PROPRIO: 'Hôte absent · intégral',
  NON_CONFORMITE_LOGEMENT: 'Logement non conforme',
  NO_SHOW_LOCATAIRE: 'Non-présentation',
  DEPASSEMENT_PERSONNES: 'Dépassement de personnes',
};

const DISPUTE_LABELS: Record<string, string> = {
  LOGEMENT_NON_CONFORME: 'Logement non conforme',
  LOGEMENT_INACCESSIBLE: 'Accès impossible',
  DOMMAGES: 'Dégâts ou propreté',
  DEPASSEMENT_PERSONNES: 'Nuisances',
  NON_PAIEMENT: 'Frais supplémentaires',
  AUTRE: 'Autre motif',
};

const PAYMENT_NAMES: Record<string, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  STRIPE: 'carte bancaire',
  CARD: 'carte bancaire',
};

const fcfa = (n: number | string | null | undefined) => formatFCFA(Number(n ?? 0));
const amountOnly = (n: number | string | null | undefined) => fcfa(n).replace(/\s*FCFA$/, '');

/** Contenu de l'onglet « Séjour » et barre du bas pour une étape donnée. */
export function renderStage(
  res: ReservationDetail,
  stage: TenantStage,
  h: StageHandlers,
  now: Date,
): { content: React.ReactNode; sticky: React.ReactNode | null } {
  const host = res.proprietaire;
  const hostName = host?.prenom ?? 'l’hôte';
  const photo = res.logement?.photos?.[0]?.url;
  const titre = res.logement?.titre ?? 'Votre logement';
  const place = res.logement?.quartier || res.logement?.ville || '';
  const nights = `${res.nbNuits} nuit${res.nbNuits > 1 ? 's' : ''}`;
  const dates = `${shortDate(res.dateDebut)} → ${shortDate(res.dateFin)}`;
  const total = fcfa(res.totalLocataire);
  // En acompte, Paixi ne détient que l'acompte : c'est lui qui est bloqué, versé ou remboursé
  const deposit = isDeposit(res);
  const paid = fcfa(escrowAmount(res));
  const balance = balanceDue(res);
  const paidWord = deposit ? `votre acompte de ${paid}` : paid;
  const { arrival, departure } = stayHours(res);
  const phoneLocked = !hostPhoneUnlocked(res, now);
  const canCall = !!host?.telephone && !phoneLocked;
  const provider = PAYMENT_NAMES[res.paiement?.fournisseur ?? ''] ?? res.paiement?.fournisseur ?? 'mobile money';
  const hostRow = host ? <HostRow prenom={host.prenom} nom={host.nom} phone={host.telephone} phoneLocked={phoneLocked} /> : null;
  const callBtn = canCall ? (
    <PillButton label="Appeler" variant="ghost" icon={<Phone size={16} color={INK} />} onPress={() => Linking.openURL(`tel:${host!.telephone}`)} />
  ) : null;
  const itineraryBtn = (
    <PillButton
      label="Itinéraire"
      variant="ink"
      flex={2}
      icon={<Navigation size={16} color={colors.lime[400]} />}
      onPress={() => {
        const q = encodeURIComponent([res.logement?.adresse, place, res.logement?.ville].filter(Boolean).join(', '));
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
      }}
    />
  );

  // Supplément « voyageurs en plus » en attente : réglé en espèces ou contesté
  const pendingFee = (res.demandesFrais ?? []).find((f) => f.statut === 'EN_ATTENTE');
  switch (stage) {
    // ── Paiement en cours de validation ─────────────────────────────────────
    case 'payment-pending':
      return {
        content: (
          <>
            <StayHero photoUrl={photo} chip={<StatusChip label="Paiement en cours" tone="gold" />} title={titre} meta={`${dates} · ${nights} · ${deposit ? `acompte ${paid}` : total}`} />
            <NowCard>
              <NowTitle>On confirme votre paiement {provider}</NowTitle>
              <Body>Quelques minutes en général. Vous pouvez fermer l’app : on vous prévient dès que c’est bon.</Body>
              <Steps
                items={[
                  { label: 'Demande créée', meta: clock(res.creeLe), state: 'done' },
                  { label: `Paiement ${provider} en vérification`, meta: 'en cours', state: 'current' },
                  { label: `Demande envoyée à ${hostName}`, state: 'todo' },
                ]}
              />
            </NowCard>
          </>
        ),
        sticky: <StickyBar><PillButton label="Annuler la demande" variant="ghost" onPress={h.onCancel} /></StickyBar>,
      };

    // ── En attente de l'hôte (48 h) ─────────────────────────────────────────
    case 'awaiting-host': {
      const left = timeLeft(res.delaiConfirmation, now);
      return {
        content: (
          <>
            <StayHero photoUrl={photo} chip={<StatusChip label="En attente de l’hôte" tone="gold" />} title={titre} meta={`${dates} · ${nights} · ${res.nbPersonnes} voyageur${res.nbPersonnes > 1 ? 's' : ''}`} />
            <NowCard aside={left ? `${left} restantes` : undefined}>
              <NowTitle>Rien à faire, on s’occupe du reste</NowTitle>
              <Body>
                {left ? `${hostName} a encore ${left} pour répondre. ` : ''}Dès qu’il accepte, vous recevez l’adresse exacte, les horaires et le livret d’accueil.
              </Body>
            </NowCard>
            <PaymentCard res={res} step="blocked" onDossier={h.onDossier} note={`Si ${hostName} refuse ou ne répond pas à temps, vous êtes remboursé intégralement.`} />
            {hostRow}
          </>
        ),
        sticky: <StickyBar><PillButton label="Annuler la demande" variant="ghost" onPress={h.onCancel} /></StickyBar>,
      };
    }

    // ── Confirmée, avant le jour J ──────────────────────────────────────────
    case 'confirmed': {
      const split = depositSplit(res);
      const address = res.logement?.adresse || [place, res.logement?.ville].filter(Boolean).join(', ');
      return {
        content: (
          <>
            <StayHero
              photoUrl={photo}
              chip={<StatusChip label={split ? 'Confirmée · acompte payé' : 'Confirmée'} tone="lime" />}
              title={`Arrivée ${longDate(res.dateDebut)}, ${arrival}`}
              meta={`${titre} · ${nights}`}
            />
            {split ? (
              <NowCard tone="lime" label="MAINTENANT · PRÉVOYEZ LE SOLDE">
                <Body style={{ color: colors.forest[800], fontFamily: typography.fontBodySemiBold }}>À régler à {hostName} à votre arrivée</Body>
                <BigAmount amount={amountOnly(split.balance)} size={38} />
                <View style={styles.splitBar}>
                  <View style={[styles.splitFill, { width: `${Math.round((split.paid / (split.paid + split.balance)) * 100)}%` }]} />
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.small}><Text style={styles.bold}>{amountOnly(split.paid)}</Text> payés en ligne</Text>
                  <Text style={styles.small}>Total {amountOnly(split.paid + split.balance)}</Text>
                </View>
                <InfoNote icon={<Lock size={15} color={INK} strokeWidth={2.2} />}>
                  Votre acompte reste protégé chez Paixi jusqu’à votre arrivée. Le solde se règle sur place, directement à l’hôte : gardez une preuve.
                </InfoNote>
              </NowCard>
            ) : (
              <NowCard tone="lime" aside={`J-${Math.max(1, Math.ceil((new Date(res.dateDebut).getTime() - now.getTime()) / 86_400_000))}`}>
                <NowTitle>Préparez votre arrivée</NowTitle>
                <View style={styles.addressCard}>
                  <View style={styles.addressIcon}>
                    <MapPin size={18} color={INK} strokeWidth={2.2} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.addressText} numberOfLines={2}>{address || 'Adresse dans le livret d’accueil'}</Text>
                    <Text style={styles.small}>Indications dans le livret</Text>
                  </View>
                  {address ? (
                    <TouchableOpacity
                      onPress={async () => {
                        tap();
                        await Clipboard.setStringAsync(address);
                      }}
                      style={styles.copyBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Copier l’adresse"
                    >
                      <Copy size={16} color={INK} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.pair}>
                  <View style={styles.pairCell}><Text style={styles.pairLabel}>ARRIVÉE</Text><Text style={styles.pairValue}>dès {arrival}</Text></View>
                  <View style={styles.pairCell}><Text style={styles.pairLabel}>DÉPART</Text><Text style={styles.pairValue}>avant {departure}</Text></View>
                </View>
                <TouchableOpacity onPress={h.onWelcomeGuide} style={styles.inkRow} accessibilityRole="button">
                  <BookOpen size={17} color={colors.lime[400]} />
                  <Text style={styles.inkRowText}>Livret d’accueil · accès, règles</Text>
                  <ChevronRight size={16} color={colors.forest[300]} />
                </TouchableOpacity>
              </NowCard>
            )}
            {hostRow}
            <View style={styles.escrowLine}>
              <Lock size={14} color={colors.forest[600]} strokeWidth={2.2} />
              <Text style={styles.small}>
                <Text style={styles.bold}>{deposit ? `Acompte de ${paid} bloqué` : `${paid} bloqués`}</Text> · versé{deposit ? '' : 's'} à {hostName} à votre arrivée
              </Text>
            </View>
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label="Annuler" variant="ghost" onPress={h.onCancel} />
            {itineraryBtn}
          </StickyBar>
        ),
      };
    }

    // ── Jour J : l'hôte prépare l'état des lieux ────────────────────────────
    case 'day-waiting': {
      const photos = (res.photosEtatLieu ?? []).filter((p) => p.type === 'CHECKIN').length;
      return {
        content: (
          <>
            <StageHeadline chip={<StatusChip label={`Arrivée aujourd’hui · ${arrival}`} tone="ink" />} line1={`${hostName} prépare`} line2="votre arrivée." />
            <NowCard label="MAINTENANT · ÉTAT DES LIEUX D’ENTRÉE">
              <Steps
                items={[
                  { label: `${hostName} photographie le logement`, meta: photos ? `${photos} photo${photos > 1 ? 's' : ''}` : 'bientôt', state: 'current' },
                  { label: 'Vous vérifiez sur place', state: 'todo' },
                  { label: `Le paiement est versé à ${hostName}`, state: 'todo' },
                ]}
              />
              <InfoNote icon={<ShieldCheck size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
                On vous prévient dès que les photos sont prêtes. Ne validez rien avant d’être sur place.
              </InfoNote>
            </NowCard>
            <InfoNote tone="white" icon={<Clock size={15} color={colors.gold[700]} strokeWidth={2.2} />}>
              {hostName} n’est pas là à l’heure ? Passé 30 min de retard, vous pourrez signaler son absence ici.
            </InfoNote>
            <InfoNote tone="white" icon={<ShieldCheck size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
              Une fois l’état des lieux de {hostName} fait, et sans signalement de votre part, le séjour démarre automatiquement 6 h après l’heure d’arrivée.
            </InfoNote>
            {hostRow}
          </>
        ),
        sticky: (
          <StickyBar>
            {callBtn}
            {itineraryBtn}
          </StickyBar>
        ),
      };
    }

    // ── Jour J : hôte en retard ─────────────────────────────────────────────
    case 'host-absent': {
      const start = new Date(res.dateDebut);
      const lateMin = Math.max(0, Math.round((now.getTime() - start.getTime()) / 60_000));
      return {
        content: (
          <>
            <StageHeadline chip={<StatusChip label="Hôte en retard" tone="red" />} line1={`${hostName} n’est pas`} line2="encore arrivé." />
            <View style={styles.lateCard}>
              <LateCell label="PRÉVU" value={clock(res.dateDebut)} />
              <LateCell label="MAINTENANT" value={clock(now.toISOString())} />
              <LateCell label="RETARD" value={lateMin >= 60 ? `${Math.floor(lateMin / 60)} h ${lateMin % 60}` : `${lateMin} min`} alert />
            </View>
            <NowCard>
              <NowTitle>Essayez d’abord de joindre {hostName}. Toujours rien ? Signalez son absence.</NowTitle>
              <Text style={styles.eyebrow}>SI VOUS SIGNALEZ</Text>
              <NumberedLine n={1} text={`${hostName} est prévenu immédiatement`} />
              <NumberedLine n={2} text={<>Il a <Text style={styles.bold}>2 h</Text> pour faire l’état des lieux</>} />
              <NumberedLine n={3} highlight text={<>Sinon : séjour annulé, <Text style={styles.bold}>{paid} remboursés</Text></>} />
              <Body>Il arrive finalement ? Vous pourrez lui accorder 2 h de plus en un geste.</Body>
            </NowCard>
          </>
        ),
        sticky: (
          <StickyBar>
            {callBtn}
            <PillButton
              label="Signaler son absence"
              variant="danger"
              flex={2}
              loading={h.actions.pending === 'report-absent'}
              onPress={() =>
                Alert.alert(`Signaler l’absence de ${hostName} ?`, `${hostName} aura 2 h pour réagir. Sinon, la réservation est annulée et remboursée.`, [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Signaler', style: 'destructive', onPress: () => h.actions.reportAbsent() },
                ])
              }
            />
          </StickyBar>
        ),
      };
    }

    // ── Jour J : absence signalée, l'hôte a 2 h ─────────────────────────────
    case 'absent-reported': {
      const deadline = res.absenceSignaleeLe ? new Date(new Date(res.absenceSignaleeLe).getTime() + 2 * 3_600_000).toISOString() : null;
      const left = timeLeft(deadline, now);
      return {
        content: (
          <>
            <StageHeadline
              chip={<StatusChip label="Absence signalée" tone="gold" />}
              line1={`${hostName} a jusqu’à`}
              line2={deadline ? `${clock(deadline)} pour réagir.` : '2 h pour réagir.'}
            />
            <NowCard aside={left ? `${left} restantes` : undefined}>
              <Steps
                items={[
                  { label: 'Absence signalée', meta: res.absenceSignaleeLe ? clock(res.absenceSignaleeLe) : undefined, state: 'done' },
                  { label: `${hostName} fait l’état des lieux`, meta: left ?? undefined, state: 'current' },
                  { label: `Sinon : annulation et ${paid} remboursés`, state: 'todo' },
                ]}
              />
              <Body>{hostName} est arrivé mais a besoin d’un peu plus de temps ? Accordez-lui 2 h de plus.</Body>
            </NowCard>
            {hostRow}
          </>
        ),
        sticky: (
          <StickyBar>
            {callBtn}
            <PillButton label="Accorder 2 h de plus" variant="ink" flex={2} loading={h.actions.pending === 'extend-absent'} onPress={() => h.actions.extendAbsent()} />
          </StickyBar>
        ),
      };
    }

    // ── Jour J : valider ou refuser l'état des lieux ────────────────────────
    case 'checkin-ready': {
      const photos = (res.photosEtatLieu ?? []).filter((p) => p.type === 'CHECKIN');
      const shown = photos.slice(0, 5);
      const extra = photos.length - shown.length;
      return {
        content: (
          <>
            <StageHeadline
              chip={<StatusChip label={`État des lieux prêt${res.checkinProprioLe ? ` · ${clock(res.checkinProprioLe)}` : ''}`} tone="ink" />}
              line1="Vous êtes sur place ?"
              line2="Vérifiez chaque pièce."
            />
            {pendingFee && <PendingFeeCard fee={pendingFee} hostName={hostName} onContest={() => h.onFee(pendingFee, 'contest')} />}
            <NowCard label={`MAINTENANT · ${photos.length} PHOTO${photos.length > 1 ? 'S' : ''} DE ${hostName.toUpperCase()}`}>
              <View style={styles.photoGrid}>
                {shown.map((p) => (
                  <TouchableOpacity key={p.id} onPress={() => h.onGallery('CHECKIN')} style={styles.photoCell} accessibilityRole="button" accessibilityLabel={`Photo ${p.categorie}`}>
                    <Image source={{ uri: p.url }} style={styles.photo} contentFit="cover" />
                    <Text style={styles.photoTag}>{roomLabel(p.categorie)}</Text>
                  </TouchableOpacity>
                ))}
                {extra > 0 && (
                  <TouchableOpacity onPress={() => h.onGallery('CHECKIN')} style={[styles.photoCell, styles.photoMore]} accessibilityRole="button">
                    <Text style={styles.photoMoreText}>+ {extra}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.consequence}>
                <View style={[styles.consequenceIcon, { backgroundColor: colors.forest[600] }]}><Check size={12} color={PAPER} strokeWidth={3.2} /></View>
                <Text style={styles.consequenceText}>
                  <Text style={styles.bold}>Conforme :</Text> le séjour démarre, {deposit ? `votre acompte de ${paid} est versé à ${hostName} et vous lui réglez ${fcfa(balance)} sur place.` : `${paid} sont versés à ${hostName}.`}
                </Text>
              </View>
              <View style={[styles.consequence, { backgroundColor: colors.error[50] }]}>
                <View style={[styles.consequenceIcon, { backgroundColor: colors.error[700] }]}><X size={12} color={PAPER} strokeWidth={3.2} /></View>
                <Text style={[styles.consequenceText, { color: colors.error[700] }]}><Text style={styles.bold}>Pas conforme :</Text> l’argent reste gelé et l’équipe Paixi tranche.</Text>
              </View>
            </NowCard>
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label="Refuser" variant="dangerGhost" onPress={h.onRefuse} />
            <PillButton
              label="Tout est conforme"
              variant="lime"
              flex={2}
              icon={<Check size={17} color={INK} strokeWidth={2.6} />}
              loading={h.actions.pending === 'confirm-checkin'}
              onPress={() =>
                Alert.alert('Tout est conforme ?', `En confirmant, ${deposit ? `votre acompte de ${paid} est versé` : `${paid} sont versés`} à ${hostName}. Cette action est définitive.`, [
                  { text: 'Vérifier encore', style: 'cancel' },
                  { text: 'Je confirme', onPress: () => h.actions.confirmCheckin() },
                ])
              }
            />
          </StickyBar>
        ),
      };
    }

    // ── Séjour en cours ─────────────────────────────────────────────────────
    case 'in-stay': {
      const fee = pendingFee;
      const start = new Date(res.dateDebut).getTime();
      const night = Math.min(res.nbNuits, Math.max(1, Math.floor((now.getTime() - start) / 86_400_000) + 1));
      return {
        content: (
          <>
            <View style={styles.stayCard}>
              <View style={styles.rowBetween}>
                <StatusChip label="Séjour en cours" tone="lime" />
                <Text style={styles.stayPlace}>{place}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.stayNight}>Nuit {night} sur {res.nbNuits}</Text>
                <Text style={styles.stayDeparture}>Départ {shortDate(res.dateFin)} · avant {departure}</Text>
              </View>
              <View style={styles.nightBar}>
                {Array.from({ length: res.nbNuits }, (_, i) => (
                  <View key={i} style={[styles.nightSeg, i < night && { backgroundColor: colors.lime[400] }]} />
                ))}
              </View>
            </View>

            {fee ? (
              <PendingFeeCard fee={fee} hostName={hostName} onContest={() => h.onFee(fee, 'contest')} />
            ) : (
              <NowCard>
                <NowTitle>Profitez de votre séjour</NowTitle>
                <Body>La veille du départ, pensez à l’heure de sortie : avant {departure}. Un souci sur place ? On est là.</Body>
              </NowCard>
            )}

            <View style={styles.tiles}>
              <Tile icon={<BookOpen size={20} color={INK} />} label="Livret" onPress={h.onWelcomeGuide} lime />
              <Tile icon={<Camera size={20} color={colors.forest[600]} />} label="État des lieux" onPress={() => h.onGallery('CHECKIN')} />
              <Tile
                icon={<Phone size={20} color={colors.forest[600]} />}
                label={hostName}
                onPress={() => (canCall ? Linking.openURL(`tel:${host!.telephone}`) : undefined)}
              />
              <Tile icon={<LifeBuoy size={20} color={colors.forest[600]} />} label="Aide" onPress={h.onSupport} />
            </View>

            <TouchableOpacity onPress={h.onReportProblem} style={styles.problemRow} accessibilityRole="button">
              <View style={styles.problemIcon}><AlertTriangle size={17} color={colors.error[700]} /></View>
              <View style={styles.flex}>
                <Text style={styles.bold14}>Un problème pendant le séjour ?</Text>
                <Text style={styles.small}>Panne, propreté, nuisances… déclarez-le</Text>
              </View>
              <ChevronRight size={16} color={colors.neutral[500]} />
            </TouchableOpacity>

            <ReleasedLine amount={paidWord} hostName={hostName} on={res.checkinLocataireLe} onPress={h.onDossier} />
          </>
        ),
        sticky: null,
      };
    }

    // ── Séjour terminé : avis ───────────────────────────────────────────────
    case 'completed': {
      const myReview = (res.avis ?? []).find((a) => a.auteurId === h.currentUserId);
      const daysLeft = reviewDaysLeft(res, now);
      const exitPhotos = (res.photosEtatLieu ?? []).filter((p) => p.type === 'CHECKOUT');
      return {
        content: (
          <>
            <StageHeadline
              chip={<StatusChip label={`Séjour terminé · ${shortDate(res.dateFin)}`} tone="green" />}
              line1="Merci d’avoir séjourné"
              line2={place ? `à ${place}.` : 'avec Paixi.'}
            />
            <LitigeOutcome res={res} />
            {pendingFee && <PendingFeeCard fee={pendingFee} hostName={hostName} onContest={() => h.onFee(pendingFee, 'contest')} />}
            {myReview ? (
              <NowCard label="VOTRE AVIS">
                <StarsRow value={myReview.note} size={24} />
                {myReview.commentaire ? <Body>« {myReview.commentaire} »</Body> : null}
                <Body>Merci, votre avis aide les prochains voyageurs.</Body>
              </NowCard>
            ) : daysLeft !== null ? (
              <ReviewCard daysLeft={daysLeft} actions={h.actions} />
            ) : null}
            {exitPhotos.length > 0 && (
              <TouchableOpacity onPress={() => h.onGallery('CHECKOUT')} style={styles.exitRow} accessibilityRole="button">
                <Image source={{ uri: exitPhotos[0].url }} style={styles.exitPhoto} contentFit="cover" />
                <View style={styles.flex}>
                  <Text style={styles.bold14}>État des lieux de sortie</Text>
                  <Text style={styles.small}>
                    {exitPhotos.length} photo{exitPhotos.length > 1 ? 's' : ''} · {shortDate(exitPhotos[0].creeLe)}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.neutral[500]} />
              </TouchableOpacity>
            )}
            {/* Avis clos (7 jours) : on donne envie de repartir, d'abord dans la même ville */}
            {daysLeft === null && <Repartir city={res.logement?.ville} exclude={res.logement?.id} />}
          </>
        ),
        // Un litige ne s'ouvre que 24 h après la clôture : ensuite, on propose de repartir
        sticky:
          res.closeLe && now.getTime() - new Date(res.closeLe).getTime() <= 86_400_000 ? (
            <StickyBar>
              <PillButton label="Signaler un problème" variant="ghost" onPress={h.onReportProblem} />
            </StickyBar>
          ) : (
            <StickyBar>
              {res.logement?.id ? <PillButton label="Revoir ce logement" variant="ghost" onPress={() => router.push(`/listing/${res.logement!.id}` as never)} /> : null}
              <PillButton label="Mon prochain séjour" flex={1.3} onPress={() => router.navigate('/(tenant)/explorer' as never)} />
            </StickyBar>
          ),
      };
    }

    // ── Litige en cours ─────────────────────────────────────────────────────
    case 'disputed': {
      const litige = res.litige;
      return {
        content: (
          <>
            <StageHeadline chip={<StatusChip label="Litige en cours" tone="red" />} line1="L’équipe Paixi examine" line2="votre dossier." />
            <View style={styles.darkCard}>
              <Steps
                light
                items={[
                  { label: 'Signalement déclaré', meta: litige ? shortDate(litige.creeLe) : undefined, state: 'done' },
                  { label: 'Examen par un médiateur', meta: 'en cours', state: 'current' },
                  { label: 'Décision', state: 'todo' },
                ]}
              />
            </View>
            {litige && (
              <NowCard label="LE SIGNALEMENT" aside={DISPUTE_LABELS[litige.motif] ?? litige.motif}>
                <Text style={styles.quote}>« {litige.description} »</Text>
              </NowCard>
            )}
            <InfoNote icon={<Lock size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
              Les fonds encore bloqués sont gelés : personne n’y a accès tant que la décision n’est pas rendue.
            </InfoNote>
          </>
        ),
        sticky: (
          <StickyBar>
            <PillButton label="Écrire au médiateur" variant="ink" onPress={h.onSupport} />
          </StickyBar>
        ),
      };
    }

    // ── Annulée ─────────────────────────────────────────────────────────────
    case 'cancelled':
    case 'expired': {
      const refund = res.refunds?.[0];
      // Un remboursement porte sur ce qui a été payé en ligne (l'acompte en formule acompte)
      const refundAmount = refund ? Number(refund.montantLocataire) : stage === 'expired' ? escrowAmount(res) : null;
      const kept = refundAmount !== null ? Math.max(0, escrowAmount(res) - refundAmount) : 0;
      const refundDone = refund?.statut === 'EXECUTE';
      const policy = res.politiqueAppliquee ? POLICY_LABELS[res.politiqueAppliquee] ?? res.politiqueAppliquee : null;
      const expired = stage === 'expired';
      return {
        content: (
          <>
            {expired ? (
              <StageHeadline chip={<StatusChip label="Demande expirée" tone="gold" />} line1={`${hostName} n’a pas répondu`} line2="à temps." />
            ) : (
              <StayHero
                dimmed
                photoUrl={photo}
                chip={<StatusChip label={`Annulée${res.annuleLe ? ` · ${shortDate(res.annuleLe)}` : ''}`} tone="grey" />}
                title={titre}
                meta={`${dates} · ${nights}`}
              />
            )}
            <LitigeOutcome res={res} />
            {refundAmount !== null && refundAmount > 0 ? (
              <NowCard tone="dark" label={expired ? 'REMBOURSÉ INTÉGRALEMENT' : 'VOTRE REMBOURSEMENT'}>
                <BigAmount amount={amountOnly(refundAmount)} light size={38} />
                {expired ? (
                  <Body light>Frais compris. Ce n’est pas de votre fait : rien n’est retenu.</Body>
                ) : (
                  <View style={styles.breakdown}>
                    <BreakdownLine label={deposit ? 'Acompte payé' : 'Payé'} value={amountOnly(escrowAmount(res))} />
                    {kept > 0 && <BreakdownLine label="Non remboursé" value={`− ${amountOnly(kept)}`} />}
                    {policy && <BreakdownLine label="Barème appliqué" value={policy} strong />}
                  </View>
                )}
              </NowCard>
            ) : (
              <NowCard>
                <NowTitle>Aucun remboursement</NowTitle>
                <Body>{policy ? `Barème appliqué : ${policy}. ` : ''}Une question ? L’équipe Paixi est joignable depuis l’aide.</Body>
              </NowCard>
            )}
            {refundAmount !== null && refundAmount > 0 && (
              <NowCard label="SUIVI DU REMBOURSEMENT">
                <Steps
                  items={[
                    { label: expired ? 'Demande expirée' : 'Annulation enregistrée', meta: res.annuleLe ? shortDate(res.annuleLe) : undefined, state: 'done' },
                    { label: `Remboursement ${provider}`, meta: refundDone ? 'effectué' : 'en cours', state: refundDone ? 'done' : 'current' },
                    { label: 'Reçu sur votre compte', meta: refundDone ? undefined : 'sous 3 à 5 j. ouvrés', state: refundDone ? 'done' : 'todo' },
                  ]}
                />
              </NowCard>
            )}
          </>
        ),
        sticky: <ExploreSticky lime={expired} onSupport={h.onSupport} />,
      };
    }
  }
}

// ── Sous-composants ──────────────────────────────────────────────────────────

/** « Envie de repartir ? » : logements libres ce week-end, dans la même ville si possible. */
function PendingFeeCard({ fee, hostName, onContest }: { fee: DemandeFraisReservation; hostName: string; onContest: () => void }) {
  return (
    <NowCard tone="gold" label="VOYAGEURS EN PLUS · À RÉGLER">
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.feeTitle}>{fee.description || fee.titre}</Text>
          <Text style={[styles.small, { color: colors.gold[700] }]}>déclaré par {hostName}</Text>
        </View>
        <BigAmount amount={amountOnly(fee.montant)} size={26} />
      </View>
      <Body style={{ color: colors.gold[700] }}>
        Calculé avec le tarif par voyageur de l’annonce. Réglez-le en espèces à {hostName} : il confirme la réception dans l’app.
      </Body>
      <PillButton label="Ce n’est pas juste ? Contester" variant="ghost" onPress={onContest} />
    </NowCard>
  );
}

function Repartir({ city, exclude }: { city?: string | null; exclude?: string }) {
  const local = useWeekendPicks(!!city, city);
  const anywhere = useWeekendPicks(!local.isLoading && !(local.data ?? []).some((l) => l.id !== exclude));
  const fromCity = (local.data ?? []).filter((l) => l.id !== exclude);
  const items = fromCity.length ? fromCity : (anywhere.data ?? []).filter((l) => l.id !== exclude);
  if (!items.length) return null;
  return <WeekendStrip items={items} title="Envie de repartir ?" sub={fromCity.length && city ? `libres ce week-end à ${city}` : 'libres ce week-end'} />;
}

function PaymentCard({ res, step, note, onDossier }: { res: ReservationDetail; step: 'blocked' | 'released'; note: string; onDossier: () => void }) {
  return (
    <NowCard label={isDeposit(res) ? 'ACOMPTE PROTÉGÉ' : 'PAIEMENT PROTÉGÉ'} aside={fcfa(escrowAmount(res))}>
      <EscrowTrack paidOn={shortDate(res.paiement?.confirmeLeWebhook ?? res.creeLe)} step={step} />
      <View style={styles.rowBetween}>
        <Text style={[styles.small, styles.flex]}>{note}</Text>
        <TouchableOpacity onPress={onDossier} accessibilityRole="link">
          <Text style={styles.link}>Détail ›</Text>
        </TouchableOpacity>
      </View>
    </NowCard>
  );
}

function ReleasedLine({ amount, hostName, on, onPress }: { amount: string; hostName: string; on?: string | null; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.released} accessibilityRole="button">
      <View style={styles.releasedIcon}><Check size={12} color={PAPER} strokeWidth={3.2} /></View>
      <Text style={[styles.small, styles.flex, { color: colors.forest[800] }]}>
        <Text style={styles.bold}>
          {amount} versé{amount.startsWith('votre acompte') ? '' : 's'} à {hostName}
        </Text>
        {on ? ` le ${shortDate(on)}` : ''}
      </Text>
      <Text style={styles.link}>Détail ›</Text>
    </TouchableOpacity>
  );
}

function ReviewCard({ daysLeft, actions }: { daysLeft: number; actions: TenantActions }) {
  const [note, setNote] = React.useState(0);
  const [comment, setComment] = React.useState('');
  return (
    <NowCard tone="lime" label="MAINTENANT · VOTRE AVIS" aside={`encore ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}>
      <NowTitle>Comment s’est passé votre séjour ?</NowTitle>
      <StarsRow value={note} onChange={setNote} size={40} />
      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        placeholder="Un mot pour les prochains voyageurs (facultatif)"
        placeholderTextColor={colors.forest[800]}
        style={styles.reviewInput}
        accessibilityLabel="Commentaire"
      />
      <PillButton label="Publier mon avis" variant="ink" disabled={note === 0} loading={actions.pending === 'rate-owner'} onPress={() => actions.rateOwner(note, comment)} />
    </NowCard>
  );
}

function StarsRow({ value, onChange, size }: { value: number; onChange?: (n: number) => void; size: number }) {
  return (
    <View style={styles.stars} accessibilityRole={onChange ? 'adjustable' : 'image'} accessibilityLabel={`${value} étoiles sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <TouchableOpacity
          key={i}
          disabled={!onChange}
          onPress={() => {
            tap();
            onChange?.(i + 1);
          }}
          hitSlop={4}
        >
          <Star size={size} color={INK} fill={i < value ? INK : 'transparent'} strokeWidth={1.6} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** Décision rendue sur un litige (fondé / non fondé), affichée sur l'étape qui suit. */
function LitigeOutcome({ res }: { res: ReservationDetail }) {
  const l = res.litige;
  if (!l || l.statut === 'EN_ATTENTE') return null;
  const fonde = l.statut === 'FONDE';
  const compensation = l.montantCompensation ? Number(l.montantCompensation) : 0;
  return (
    <NowCard tone="dark" label={`DÉCISION DE L’ÉQUIPE PAIXI${l.resoluLe ? ` · ${shortDate(l.resoluLe)}` : ''}`}>
      <NowTitle light>{fonde ? 'Votre signalement est jugé fondé.' : 'Votre signalement est jugé non fondé.'}</NowTitle>
      {fonde && compensation > 0 && <BigAmount amount={amountOnly(compensation)} light size={30} />}
      {l.decisionAdmin ? <Body light>« {l.decisionAdmin} »</Body> : null}
      {!fonde && <Body light>Le séjour suit son cours normal, sans pénalité.</Body>}
    </NowCard>
  );
}

function ExploreSticky({ lime, onSupport }: { lime?: boolean; onSupport: () => void }) {
  const router = useRouter();
  return (
    <StickyBar>
      {!lime && <PillButton label="Une question" variant="ghost" onPress={onSupport} />}
      <PillButton
        flex={lime ? 1 : 1.6}
        label={lime ? 'Voir les logements disponibles' : 'Trouver un logement'}
        variant={lime ? 'lime' : 'ink'}
        onPress={() => router.navigate('/(tenant)/explorer' as never)}
      />
    </StickyBar>
  );
}

function Tile({ icon, label, onPress, lime }: { icon: React.ReactNode; label: string; onPress: () => void; lime?: boolean }) {
  return (
    <TouchableOpacity
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.tile, lime && styles.tileLime]}
      accessibilityRole="button"
    >
      {icon}
      <Text style={styles.tileText} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
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

function NumberedLine({ n, text, highlight }: { n: number; text: React.ReactNode; highlight?: boolean }) {
  return (
    <View style={styles.numbered}>
      <View style={[styles.numberedDot, highlight && { backgroundColor: colors.lime[400] }]}>
        <Text style={styles.numberedN}>{n}</Text>
      </View>
      <Text style={styles.numberedText}>{text}</Text>
    </View>
  );
}

function BreakdownLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownValue, strong && { fontFamily: typography.fontBodyBold }]}>{value}</Text>
    </View>
  );
}

const ROOMS: Record<string, string> = {
  ENTREE: 'Entrée',
  SALON: 'Salon',
  CHAMBRE: 'Chambre',
  CUISINE: 'Cuisine',
  SALLE_DE_BAIN: 'Bain',
  TERRASSE: 'Terrasse',
  AUTRE: 'Autre',
};
const roomLabel = (c: string) => ROOMS[c] ?? c;

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  small: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[600] },
  bold: { fontFamily: typography.fontBodyBold, color: INK },
  bold14: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  link: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.link },
  eyebrow: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1, color: colors.neutral[600] },
  quote: { fontFamily: typography.fontBody, fontSize: 14, lineHeight: 21, color: INK },

  splitBar: { height: 12, borderRadius: 6, backgroundColor: 'rgba(4,25,18,0.1)', overflow: 'hidden' },
  splitFill: { height: 12, backgroundColor: INK },

  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, backgroundColor: colors.neutral[0] },
  addressIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  addressText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  copyBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.neutral[200], alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: 8 },
  pairCell: { flex: 1, padding: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(4,25,18,0.07)' },
  pairLabel: { fontFamily: typography.fontBodyBold, fontSize: 10, color: colors.forest[800] },
  pairValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: INK },
  pairRow: { flexDirection: 'row', gap: 8 },
  inkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 16, backgroundColor: INK },
  inkRowText: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 14, color: PAPER },
  escrowLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },

  lateCard: { flexDirection: 'row', padding: 16, borderRadius: 24, backgroundColor: INK },
  lateCell: { flex: 1, alignItems: 'center' },
  lateLabel: { fontFamily: typography.fontBodyBold, fontSize: 10, color: colors.forest[200] },
  lateValue: { marginTop: 2, fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: PAPER },
  numbered: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numberedDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.forest[50], alignItems: 'center', justifyContent: 'center' },
  numberedN: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },
  numberedText: { flex: 1, fontFamily: typography.fontBody, fontSize: 13, color: INK },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoCell: { width: '31.9%', height: 84, borderRadius: 14, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoTag: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(4,25,18,0.7)',
    color: PAPER,
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
  },
  photoMore: { backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  photoMoreText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: PAPER },
  consequence: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.forest[50] },
  consequenceIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  consequenceText: { flex: 1, fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: INK },

  stayCard: { gap: 10, padding: 16, borderRadius: 26, backgroundColor: INK },
  stayPlace: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[200] },
  stayNight: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, letterSpacing: -0.6, color: PAPER },
  stayDeparture: { flexShrink: 1, textAlign: 'right', fontFamily: typography.fontBody, fontSize: 12, color: '#C9DBD1' },
  nightBar: { flexDirection: 'row', gap: 4 },
  nightSeg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(248,251,244,0.15)' },
  feeTitle: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    height: 82,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  tileLime: { backgroundColor: colors.lime[400], borderColor: colors.lime[400] },
  tileText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: INK },
  problemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  problemIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.error[50], alignItems: 'center', justifyContent: 'center' },
  released: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.forest[50] },
  releasedIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.forest[600], alignItems: 'center', justifyContent: 'center' },

  stars: { flexDirection: 'row', gap: 8 },
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
  exitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  exitPhoto: { width: 44, height: 44, borderRadius: 12 },

  darkCard: { padding: 16, borderRadius: 24, backgroundColor: INK },
  breakdown: { gap: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(248,251,244,0.06)' },
  breakdownLabel: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[200] },
  breakdownValue: { fontFamily: typography.fontBody, fontSize: 12, color: PAPER },
});
