import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  Archive,
  Ban,
  Banknote,
  Camera,
  Check,
  Clock,
  FileText,
  KeyRound,
  Lock,
  LogOut,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react-native';
import { colors, typography } from '../../../../shared/theme/tokens';
import { formatFCFA } from '../../../owner-home/lib/format';
import type { HistoriqueReservation, ReservationDetail } from '../../types/reservation-detail.types';
import { balanceDue, clock, escrowAmount, isDeposit, longDate, shortDate } from '../lib/stage';
import { INK, PAPER, PillButton, tap } from './ui';

type Money = 'none' | 'blocked' | 'released' | 'refunded';

interface EventCfg {
  label: (hostName: string) => string;
  icon: typeof Check;
  money: Money;
  detail?: string;
}

/** Libellés repris de la chronologie web (ReservationTimeline), vus par le locataire. */
const EVENTS: Record<string, EventCfg> = {
  PENDING: { label: () => 'Demande envoyée', icon: Clock, money: 'none' },
  PAID: { label: () => 'Paiement reçu et bloqué', icon: Lock, money: 'blocked', detail: 'Les fonds sont bloqués par Paixi' },
  CONFIRMED: { label: (h) => `Acceptée par ${h}`, icon: Check, money: 'blocked' },
  CHECKED_IN: { label: () => 'Arrivée confirmée', icon: KeyRound, money: 'released', detail: 'Versement à l’hôte déclenché' },
  CHECKED_OUT: { label: () => 'Départ effectué', icon: LogOut, money: 'released' },
  COMPLETED: { label: () => 'Séjour clôturé', icon: ShieldCheck, money: 'released' },
  DISPUTED: { label: () => 'Litige déclaré', icon: TriangleAlert, money: 'blocked', detail: 'Fonds gelés pendant l’examen' },
  CANCELLED: { label: () => 'Réservation annulée', icon: Ban, money: 'refunded' },
  EXPIRED: { label: (h) => `${h} n’a pas répondu à temps`, icon: Clock, money: 'refunded' },
  REFUNDED: { label: () => 'Remboursement effectué', icon: Banknote, money: 'refunded' },
};

/** Lecture côté hôte : seules quelques étapes changent de libellé. */
const OWNER_EVENTS: Record<string, Partial<EventCfg>> = {
  PAID: { detail: 'Le paiement du voyageur est bloqué par Paixi' },
  CONFIRMED: { label: () => 'Demande acceptée' },
  CHECKED_IN: { label: () => 'Arrivée validée', detail: 'Versement sur votre portefeuille' },
  EXPIRED: { label: () => 'Demande expirée sans réponse' },
};

/** Événements écrits par l'API sous un code système (modifiePar). */
const SYSTEM_EVENTS: Record<string, Partial<EventCfg>> = {
  OWNER_SIGNAL_TENANT_NOSHOW: { label: () => 'Absence du voyageur signalée', icon: TriangleAlert, detail: undefined },
  SYSTEM_CRON_NOSHOW: { label: () => 'Clôturée en non-présentation', icon: Ban, detail: undefined },
  SYSTEM_AUTO_CHECKIN: { label: () => 'Arrivée validée automatiquement' },
  SYSTEM_AUTOCLOTURE: { label: () => 'Séjour clôturé automatiquement' },
  SYSTEM_ABSENCE: { label: () => 'Annulée : hôte absent', icon: Ban },
  SYSTEM_CONFIRMATION_EXPIRY: { label: () => 'Demande expirée sans réponse' },
};

const RAIL: Record<Money, string> = {
  none: colors.neutral[200],
  blocked: '#C8E85A',
  released: colors.forest[600],
  refunded: colors.neutral[300],
};

/** Durée de conservation des photos d'état des lieux côté API (cleanup-etat-lieux-photos). */
const PHOTO_RETENTION_DAYS = 23;

const fcfa = (n: number | string | null | undefined) => formatFCFA(Number(n ?? 0));
const amountOnly = (n: number | string | null | undefined) => fcfa(n).replace(/\s*FCFA$/, '');

export function Dossier({
  res,
  currentUserId,
  onGallery,
  onReportProblem,
  canReport,
  viewer = 'tenant',
  payout,
}: {
  res: ReservationDetail;
  currentUserId?: string;
  onGallery: (type: 'CHECKIN' | 'CHECKOUT') => void;
  onReportProblem: () => void;
  canReport: boolean;
  /** Le dossier est partagé : seuls les libellés et la section paiement changent. */
  viewer?: 'tenant' | 'owner';
  /** Côté hôte : ce que Paixi lui verse (acompte − commission en formule acompte). */
  payout?: number;
}) {
  const owner = viewer === 'owner';
  const host = res.proprietaire;
  const hostName = owner ? 'Vous' : (host?.prenom ?? 'L’hôte');
  const guestName = res.locataire?.prenom ?? 'Le voyageur';
  const manager = res.logement?.gestionnaire;
  const paidFees = (res.demandesFrais ?? []).filter((f) => f.statut === 'PAYE');
  // Suppléments réglés en espèces : hors « via Paixi » (l'arbitrage, lui, passe par le portefeuille)
  const cashFees = paidFees.filter((f) => f.methodePaiement === 'ESPECES' || f.methodePaiement === 'LIQUIDE');
  const walletFees = paidFees.filter((f) => !cashFees.includes(f));
  const photo = res.logement?.photos?.[0]?.url;
  const ref = `PX-${res.id.slice(0, 6).toUpperCase()}`;
  const checkin = (res.photosEtatLieu ?? []).filter((p) => p.type === 'CHECKIN');
  const checkout = (res.photosEtatLieu ?? []).filter((p) => p.type === 'CHECKOUT');
  // Les photos sont supprimées par l'API 23 jours après la fin du séjour (cleanup-etat-lieux-photos)
  const purged = Date.now() - new Date(res.dateFin).getTime() > PHOTO_RETENTION_DAYS * 86_400_000;
  const missingEntry = res.checkinProprioLe ? 'Indisponibles' : 'À l’arrivée';
  const missingExit = res.checkoutProprioLe ? 'Indisponibles' : 'Au départ';
  const purgedOn = new Date(new Date(res.dateFin).getTime() + PHOTO_RETENTION_DAYS * 86_400_000).toISOString();

  const actor = (e: HistoriqueReservation) => {
    if (!e.modifiePar) return 'Paixi';
    if (e.modifiePar === currentUserId) return 'Vous';
    if (e.modifiePar === 'OWNER_SIGNAL_TENANT_NOSHOW' || e.modifiePar === host?.id) return owner ? 'Vous' : hostName;
    if (e.modifiePar === res.locataire?.id) return guestName;
    if (manager && e.modifiePar === manager.id) return manager.prenom;
    return 'Paixi';
  };
  const eventCfg = (e: HistoriqueReservation): EventCfg => {
    const base = EVENTS[e.nouveauStatut] ?? { label: () => e.nouveauStatut, icon: Clock, money: 'none' as Money };
    return { ...base, ...(owner ? OWNER_EVENTS[e.nouveauStatut] : undefined), ...(e.modifiePar ? SYSTEM_EVENTS[e.modifiePar] : undefined) };
  };

  // Événements dans l'ordre chronologique, groupés par jour
  const events = [...(res.historique ?? [])].sort((a, b) => a.modifieLe.localeCompare(b.modifieLe));
  const days: Array<{ day: string; items: HistoriqueReservation[] }> = [];
  for (const e of events) {
    const day = longDate(e.modifieLe);
    const last = days[days.length - 1];
    if (last && last.day === day) last.items.push(e);
    else days.push({ day, items: [e] });
  }

  return (
    <View style={styles.wrap}>
      {/* ── Ticket de références ─────────────────────────────────────────── */}
      <View style={styles.ticket}>
        <View style={styles.ticketTop}>
          {photo ? <Image source={{ uri: photo }} style={styles.ticketPhoto} contentFit="cover" /> : <View style={[styles.ticketPhoto, { backgroundColor: colors.forest[800] }]} />}
          <View style={styles.flex}>
            <Text style={styles.ticketTitle} numberOfLines={1}>{res.logement?.titre ?? 'Votre logement'}</Text>
            <Text style={styles.ticketMeta}>
              {shortDate(res.dateDebut)} → {shortDate(res.dateFin)} · {res.nbNuits} nuit{res.nbNuits > 1 ? 's' : ''} · {res.nbPersonnes} voyageur{res.nbPersonnes > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.perforation}>
          <View style={[styles.notch, { left: -11 }]} />
          <View style={styles.dashes} />
          <View style={[styles.notch, { right: -11 }]} />
        </View>
        <View style={styles.ticketGrid}>
          <TicketCell label="DOSSIER" value={ref} />
          <TicketCell label="CRÉÉ LE" value={shortDate(res.creeLe)} />
          {owner ? <TicketCell label="VOUS RECEVEZ" value={amountOnly(payout ?? res.netProprietaire)} accent /> : <TicketCell label="TOTAL" value={amountOnly(res.totalLocataire)} accent />}
        </View>
      </View>

      {/* ── Historique ───────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.h2}>Historique</Text>
          <View style={styles.legend}>
            <LegendItem color={RAIL.blocked} label="Bloqué" />
            <LegendItem color={RAIL.released} label="Versé" />
          </View>
        </View>
        <View style={styles.card}>
          {days.length === 0 && <Text style={styles.empty}>L’historique apparaîtra ici au fil du séjour.</Text>}
          {days.map(({ day, items }, di) => (
            <View key={day}>
              <Text style={[styles.dayLabel, di > 0 && { marginTop: 6 }]}>{day.toUpperCase()}</Text>
              {items.map((e, i) => {
                const cfg = eventCfg(e);
                const Icon = cfg.icon;
                const isLast = di === days.length - 1 && i === items.length - 1;
                const strong = cfg.money === 'released';
                const lime = e.nouveauStatut === 'PAID';
                return (
                  <View key={e.id} style={styles.event}>
                    <View style={styles.eventRail}>
                      <View style={[styles.eventIcon, lime && { backgroundColor: colors.lime[400] }, strong && { backgroundColor: colors.forest[600] }]}>
                        <Icon size={16} color={strong ? PAPER : lime ? INK : colors.forest[600]} strokeWidth={2.2} />
                      </View>
                      {!isLast && <View style={[styles.rail, { backgroundColor: RAIL[cfg.money] }]} />}
                    </View>
                    <View style={styles.eventBody}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.eventTitle}>{cfg.label(hostName)}</Text>
                        <Text style={styles.eventTime}>{clock(e.modifieLe)}</Text>
                      </View>
                      {e.nouveauStatut === 'PAID' && (
                        <Text style={styles.eventDetail}>
                          {isDeposit(res) ? `Acompte de ${fcfa(escrowAmount(res))}` : fcfa(res.totalLocataire)}
                          {res.paiement?.fournisseur ? ` · ${res.paiement.fournisseur.replace('_', ' ').toLowerCase()}` : ''}
                        </Text>
                      )}
                      {cfg.detail && e.nouveauStatut !== 'PAID' ? <Text style={styles.eventDetail}>{cfg.detail}</Text> : null}
                      {e.raison ? <Text style={styles.eventDetail} numberOfLines={2}>{e.raison}</Text> : null}
                      <Text style={[styles.actor, actor(e) === 'Paixi' && styles.actorPaixi]}>{actor(e)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* ── Paiement façon ticket de caisse ──────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.h2}>{owner ? 'Votre versement' : 'Paiement'}</Text>
        {owner ? (
          <View style={[styles.card, { gap: 12 }]}>
            <DottedLine label={`${amountOnly(res.prixNuitEffectif)} × ${res.nbNuits} nuit${res.nbNuits > 1 ? 's' : ''}`} value={amountOnly(res.totalBase)} />
            {Number(res.reductionNuits) > 0 && <DottedLine label="Réduction séjour long" value={`− ${amountOnly(res.reductionNuits)}`} />}
            {walletFees.map((f) => <DottedLine key={f.id} label={f.titre} value={`+ ${amountOnly(f.montant)}`} />)}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Via Paixi</Text>
              <Text style={styles.totalValue}>
                {amountOnly((payout ?? Number(res.netProprietaire)) + walletFees.reduce((s, f) => s + Number(f.montant), 0))} <Text style={styles.totalCur}>FCFA</Text>
              </Text>
            </View>
            {res.montantSoldeRestant ? (
              <View style={styles.methodBox}>
                <Text style={styles.methodText}>
                  Plus <Text style={styles.bold}>{amountOnly(res.montantSoldeRestant)}</Text> de solde réglé sur place par {guestName}
                </Text>
              </View>
            ) : null}
            {cashFees.map((f) => (
              <View key={f.id} style={styles.methodBox}>
                <Text style={styles.methodText}>
                  Plus <Text style={styles.bold}>{amountOnly(f.montant)}</Text> réglés en espèces · {f.titre.toLowerCase()}
                  {f.description ? ` (${f.description})` : ''}
                </Text>
              </View>
            ))}
            <View style={styles.methodBox}>
              <Text style={styles.methodText}>
                {isDeposit(res) ? (
                  <>
                    {guestName} a payé <Text style={styles.bold}>{fcfa(escrowAmount(res))}</Text> d’acompte en ligne, dont {fcfa(res.montantCommission)} de frais de service Paixi, et vous règle{' '}
                    <Text style={styles.bold}>{fcfa(balanceDue(res))}</Text> sur place.
                  </>
                ) : (
                  <>
                    {guestName} a payé <Text style={styles.bold}>{fcfa(res.totalLocataire)}</Text>, dont {fcfa(res.montantCommission)} de frais de service Paixi à sa charge.
                  </>
                )}
              </Text>
            </View>
          </View>
        ) : (
        <View style={[styles.card, { gap: 12 }]}>
          <DottedLine label={`${amountOnly(res.prixNuitEffectif)} × ${res.nbNuits} nuit${res.nbNuits > 1 ? 's' : ''}`} value={amountOnly(res.totalBase)} />
          {Number(res.reductionNuits) > 0 && <DottedLine label="Réduction séjour long" value={`− ${amountOnly(res.reductionNuits)}`} />}
          <DottedLine label="Frais de service Paixi" value={amountOnly(res.montantCommission)} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{isDeposit(res) ? 'Total du séjour' : 'Total payé'}</Text>
            <Text style={styles.totalValue}>
              {amountOnly(res.totalLocataire)} <Text style={styles.totalCur}>FCFA</Text>
            </Text>
          </View>
          {res.montantSoldeRestant ? (
            <View style={styles.methodBox}>
              <Text style={styles.methodText}>
                <Text style={styles.bold}>{amountOnly(res.montantAcompte)}</Text> d’acompte payé en ligne et protégé par Paixi · <Text style={styles.bold}>{amountOnly(res.montantSoldeRestant)}</Text> à régler à {host?.prenom ?? 'l’hôte'} sur place
              </Text>
            </View>
          ) : null}
          {res.paiement && (
            <View style={styles.methodBox}>
              <Text style={styles.methodText}>
                <Text style={styles.bold}>{res.paiement.fournisseur.replace('_', ' ')}</Text>
                {res.paiement.confirmeLeWebhook ? ` · reçu le ${shortDate(res.paiement.confirmeLeWebhook)} à ${clock(res.paiement.confirmeLeWebhook)}` : ''}
              </Text>
            </View>
          )}
          {paidFees.map((f) => (
            <View key={f.id} style={styles.methodBox}>
              <Text style={styles.methodText}>
                {f.titre} : <Text style={styles.bold}>{amountOnly(f.montant)}</Text> {cashFees.includes(f) ? `réglés en espèces à ${host?.prenom ?? 'l’hôte'}` : 'fixés par l’arbitrage Paixi'}
                {f.description ? ` (${f.description})` : ''}
              </Text>
            </View>
          ))}
        </View>
        )}
      </View>

      {/* ── Documents ────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.h2}>Documents</Text>
        <View style={styles.docs}>
          <TouchableOpacity
            disabled={!res.contratUrl}
            onPress={() => {
              tap();
              if (res.contratUrl) Linking.openURL(res.contratUrl);
            }}
            style={[styles.doc, styles.docDark]}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le contrat"
          >
            <FileText size={22} color={colors.lime[400]} />
            <View>
              <Text style={[styles.docTitle, { color: PAPER }]}>Contrat</Text>
              <Text style={[styles.docMeta, { color: colors.forest[200] }]}>{res.contratUrl ? 'PDF signé' : 'En génération'}</Text>
            </View>
          </TouchableOpacity>
          <PhotoDoc label="Entrée" photos={checkin} onPress={() => onGallery('CHECKIN')} empty={missingEntry} archived={purged && !!res.checkinProprioLe} />
          <PhotoDoc label="Sortie" photos={checkout} onPress={() => onGallery('CHECKOUT')} empty={missingExit} archived={purged && !!res.checkoutProprioLe} />
        </View>
        {purged && checkin.length === 0 && checkout.length === 0 && (res.checkinProprioLe || res.checkoutProprioLe) && (
          <View style={styles.archive}>
            <View style={styles.archiveHead}>
              <View style={styles.archiveIcon}>
                <Archive size={17} color={colors.forest[600]} strokeWidth={2.2} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.archiveTitle}>États des lieux archivés</Text>
                <Text style={styles.archiveSub}>Photos supprimées le {shortDate(purgedOn)}, {PHOTO_RETENTION_DAYS} jours après le séjour</Text>
              </View>
            </View>
            {res.checkinProprioLe && (
              <ArchiveLine label="Entrée" text={`réalisé le ${shortDate(res.checkinProprioLe)} à ${clock(res.checkinProprioLe)} par ${owner ? 'vous' : hostName}`} />
            )}
            {res.checkinLocataireLe && (
              <ArchiveLine label="Validation" text={`par ${owner ? guestName : 'vous'} le ${shortDate(res.checkinLocataireLe)} à ${clock(res.checkinLocataireLe)}`} />
            )}
            {res.checkoutProprioLe && (
              <ArchiveLine label="Sortie" text={`réalisé le ${shortDate(res.checkoutProprioLe)} à ${clock(res.checkoutProprioLe)} par ${owner ? 'vous' : hostName}`} />
            )}
            <Text style={styles.archiveFoot}>Le contrat et l’historique du séjour restent disponibles.</Text>
          </View>
        )}
      </View>

      {/* ── Les parties ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.h2}>Les parties</Text>
        <View style={[styles.card, styles.parties]}>
          <Party
            initials={initialsOf(res.locataire?.prenom, res.locataire?.nom)}
            name={owner ? `${guestName} ${res.locataire?.nom?.charAt(0) ?? ''}.` : 'Vous'}
            role="Voyageur"
          />
          <View style={styles.seal}>
            <View style={styles.sealLine}>
              <View style={styles.dashH} />
              <View style={styles.sealBadge}>
                <Svg width={18} height={23} viewBox="0 0 80 104">
                  <Rect x={10} y={30} width={15} height={72} rx={7.5} fill={PAPER} />
                  <Path d="M25 76 A46 46 0 0 1 72 28 A46 46 0 0 1 25 76 Z" fill={colors.lime[400]} />
                </Svg>
              </View>
              <View style={styles.dashH} />
            </View>
            <Text style={styles.sealLabel}>CONTRAT</Text>
          </View>
          <Party initials={initialsOf(host?.prenom, host?.nom)} name={owner ? 'Vous' : host ? `${host.prenom} ${host.nom?.charAt(0) ?? ''}.` : 'Hôte'} role="Hôte" dark />
        </View>
        {manager ? (
          <Text style={styles.partiesNote}>
            Logement géré par <Text style={styles.bold}>{manager.prenom} {manager.nom?.charAt(0) ?? ''}.</Text> sous mandat de gestion.
          </Text>
        ) : null}
        <Text style={styles.partiesNote}>Contrat horodaté entre les deux parties, conservé par Paixi.</Text>
      </View>

      {canReport && (
        <PillButton label="Signaler un problème sur ce séjour" variant="ghost" icon={<ShieldCheck size={16} color={colors.forest[600]} />} onPress={onReportProblem} />
      )}
    </View>
  );
}

function TicketCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.flex}>
      <Text style={styles.ticketLabel}>{label}</Text>
      <Text style={[styles.ticketValue, accent && { color: colors.lime[400] }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function DottedLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dotted}>
      <Text style={styles.dottedLabel}>{label}</Text>
      <View style={styles.dots} />
      <Text style={styles.dottedValue}>{value}</Text>
    </View>
  );
}

function ArchiveLine({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.archiveLine}>
      <Check size={13} color={colors.forest[600]} strokeWidth={3} />
      <Text style={styles.archiveText}>
        <Text style={styles.bold}>{label}</Text> {text}
      </Text>
    </View>
  );
}

function PhotoDoc({
  label,
  photos,
  onPress,
  empty,
  archived,
}: {
  label: string;
  photos: Array<{ url: string; creeLe: string }>;
  onPress: () => void;
  empty: string;
  archived?: boolean;
}) {
  if (photos.length === 0 && archived) {
    return (
      <View style={[styles.doc, styles.docArchived]}>
        <Archive size={22} color={colors.forest[600]} />
        <View>
          <Text style={styles.docTitle}>{label}</Text>
          <Text style={styles.docMeta}>Archivé</Text>
        </View>
      </View>
    );
  }
  if (photos.length === 0) {
    return (
      <View style={[styles.doc, styles.docEmpty]}>
        <Camera size={22} color={colors.neutral[400]} />
        <View>
          <Text style={[styles.docTitle, { color: colors.neutral[600] }]}>{label}</Text>
          <Text style={styles.docMeta}>{empty}</Text>
        </View>
      </View>
    );
  }
  return (
    <TouchableOpacity
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.doc, { padding: 0, overflow: 'hidden' }]}
      accessibilityRole="button"
      accessibilityLabel={`État des lieux ${label.toLowerCase()}`}
    >
      <Image source={{ uri: photos[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.docShade} />
      <View style={styles.docCaption}>
        <Text style={[styles.docTitle, { color: PAPER }]}>{label}</Text>
        <Text style={[styles.docMeta, { color: '#C9DBD1' }]}>
          {photos.length} photo{photos.length > 1 ? 's' : ''} · {shortDate(photos[0].creeLe)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function Party({ initials, name, role, dark }: { initials: string; name: string; role: string; dark?: boolean }) {
  return (
    <View style={styles.party}>
      <View style={[styles.partyAvatar, dark && { backgroundColor: INK }]}>
        <Text style={[styles.partyInitials, dark && { color: colors.lime[400] }]}>{initials}</Text>
        <View style={styles.partyCheck}>
          <Check size={10} color={PAPER} strokeWidth={3.4} />
        </View>
      </View>
      <Text style={styles.partyName} numberOfLines={1}>{name}</Text>
      <Text style={styles.partyRole}>{role}</Text>
    </View>
  );
}

const initialsOf = (prenom?: string | null, nom?: string | null) =>
  `${prenom?.charAt(0) ?? ''}${nom?.charAt(0) ?? ''}`.toUpperCase() || '?';

const styles = StyleSheet.create({
  wrap: { gap: 26 },
  flex: { flex: 1, minWidth: 0 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  bold: { fontFamily: typography.fontBodyBold, color: INK },

  ticket: { borderRadius: 26, backgroundColor: INK },
  ticketTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 16 },
  ticketPhoto: { width: 54, height: 54, borderRadius: 16 },
  ticketTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: PAPER },
  ticketMeta: { marginTop: 2, fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[200] },
  perforation: { height: 22, justifyContent: 'center' },
  notch: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: colors.neutral[50] },
  dashes: { marginHorizontal: 18, borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(248,251,244,0.16)' },
  ticketGrid: { flexDirection: 'row', gap: 10, padding: 18, paddingTop: 12 },
  ticketLabel: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 0.8, color: colors.forest[200] },
  ticketValue: { marginTop: 3, fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: PAPER },

  section: { gap: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h2: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, letterSpacing: -0.4, color: INK },
  legend: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 10, height: 4, borderRadius: 2 },
  legendText: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.neutral[600] },
  card: { padding: 16, paddingTop: 18, borderRadius: 26, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  empty: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },

  dayLabel: { marginBottom: 12, fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1, color: colors.neutral[600] },
  event: { flexDirection: 'row', gap: 12 },
  eventRail: { width: 34, alignItems: 'center' },
  eventIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.forest[50], alignItems: 'center', justifyContent: 'center' },
  rail: { width: 3, flex: 1, minHeight: 14, borderRadius: 2 },
  eventBody: { flex: 1, paddingTop: 6, paddingBottom: 16 },
  eventTitle: { flex: 1, fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  eventTime: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600], fontVariant: ['tabular-nums'] },
  eventDetail: { marginTop: 2, fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  actor: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.forest[50],
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.neutral[600],
  },
  actorPaixi: { backgroundColor: '#E9F3E2', color: colors.forest[800] },

  dotted: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  dottedLabel: { fontFamily: typography.fontBody, fontSize: 14, color: colors.neutral[600] },
  dots: { flex: 1, marginBottom: 4, borderBottomWidth: 1.5, borderStyle: 'dotted', borderColor: colors.neutral[300] },
  dottedValue: { fontFamily: typography.fontBody, fontSize: 14, color: INK, fontVariant: ['tabular-nums'] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  totalLabel: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  totalValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, letterSpacing: -0.5, color: INK },
  totalCur: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  methodBox: { padding: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.forest[50] },
  methodText: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[700] },

  docs: { flexDirection: 'row', gap: 8 },
  doc: { flex: 1, height: 138, borderRadius: 20, padding: 12, justifyContent: 'space-between', backgroundColor: colors.neutral[0] },
  docDark: { backgroundColor: INK },
  docEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.neutral[300], backgroundColor: 'transparent' },
  docShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(4,25,18,0.45)' },
  docCaption: { position: 'absolute', left: 12, right: 8, bottom: 12 },
  docArchived: { backgroundColor: colors.forest[50] },
  archive: { gap: 10, padding: 14, borderRadius: 20, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  archiveHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  archiveIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.forest[50], alignItems: 'center', justifyContent: 'center' },
  archiveTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  archiveSub: { marginTop: 1, fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  archiveLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  archiveText: { flex: 1, fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[700] },
  archiveFoot: { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.neutral[100], fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  docTitle: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  docMeta: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },

  parties: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  party: { flex: 1, alignItems: 'center', gap: 4 },
  partyAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.forest[50], alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  partyInitials: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: INK },
  partyCheck: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: colors.neutral[0],
    backgroundColor: colors.forest[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyName: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  partyRole: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
  seal: { width: 86, alignItems: 'center', gap: 6, marginTop: -26 },
  sealLine: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  dashH: { flex: 1, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: colors.neutral[300] },
  sealBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  sealLabel: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 0.6, color: colors.neutral[600] },
  partiesNote: { marginTop: -4, textAlign: 'center', fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
});
