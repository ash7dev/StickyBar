import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react-native';
import { radius, shadows, typography } from '../../../../../shared/theme/tokens';

export type NoticeTone = 'forest' | 'success' | 'warning' | 'error' | 'neutral';

interface MobileOwnerEscrowNoticeCardProps {
  statut: string;
  netProprietaire: number;
  isAutoCheckin?: boolean;
}

const TONE_STYLES: Record<
  NoticeTone,
  { bg: string; border: string; iconBg: string; iconColor: string; title: string; body: string }
> = {
  forest: {
    bg: '#EEF8EB',
    border: '#C1E5B7',
    iconBg: '#D6EDCF',
    iconColor: '#1B472C',
    title: '#0D2D1B',
    body: '#1F4D30',
  },
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
    title: '#065F46',
    body: '#047857',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    title: '#92400E',
    body: '#B45309',
  },
  error: {
    bg: '#FEF2F2',
    border: '#FECACA',
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
    title: '#991B1B',
    body: '#B91C1C',
  },
  neutral: {
    bg: '#F4F6F8',
    border: '#E2E8F0',
    iconBg: '#E2E8F0',
    iconColor: '#475569',
    title: '#1E293B',
    body: '#475569',
  },
};

export function MobileOwnerEscrowNoticeCard({
  statut,
  netProprietaire,
  isAutoCheckin = false,
}: MobileOwnerEscrowNoticeCardProps) {
  const formatPrice = (val: number) => {
    return val.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  };

  const getNoticeConfig = (): {
    title: string;
    sub: string;
    icon: any;
    tone: NoticeTone;
  } => {
    switch (statut) {
      case 'PENDING':
        return {
          title: 'En attente du paiement locataire',
          sub: 'Le locataire n’a pas encore finalisé le paiement. Vous serez notifié dès réception.',
          icon: Clock,
          tone: 'neutral',
        };
      case 'PAID':
        return {
          title: 'Fonds consignés sous séquestre Klef',
          sub: `Le paiement du locataire (${formatPrice(netProprietaire)}) est sécurisé. Acceptez le séjour pour débloquer le processus d'accueil.`,
          icon: Lock,
          tone: 'success',
        };
      case 'CONFIRMED':
        return {
          title: 'Garantie d\'accueil & État des lieux',
          sub: 'Les fonds restent consignés jusqu’au check-in. Photographiez le logement d’entrée pour valider la prise de possession.',
          icon: ShieldCheck,
          tone: 'forest',
        };
      case 'CHECKED_IN':
        if (isAutoCheckin) {
          return {
            title: '⚡ Check-in validé automatiquement par le système (H+6)',
            sub: `6 heures se sont écoulées après l'heure d'arrivée sans action ni litige. Le séjour a été activé automatiquement et vos fonds net (${formatPrice(netProprietaire)}) sont sécurisés.`,
            icon: CheckCircle2,
            tone: 'forest',
          };
        }
        return {
          title: 'Séjour en cours · Versement automatique',
          sub: `Vos ${formatPrice(netProprietaire)} seront automatiquement versés vers votre portefeuille dès la clôture du séjour.`,
          icon: ShieldCheck,
          tone: 'forest',
        };
      case 'COMPLETED':
        return {
          title: 'Fonds débloqués & Versés avec succès ✓',
          sub: `Le versement de ${formatPrice(netProprietaire)} a été effectué avec succès vers votre portefeuille hôte Klef.`,
          icon: CheckCircle2,
          tone: 'forest',
        };
      case 'DISPUTED':
        return {
          title: 'Litige ouvert — Traitement en cours',
          sub: 'Les fonds restent gelés sous séquestre pendant l’instruction du dossier par l’équipe d’arbitrage Klef.',
          icon: AlertTriangle,
          tone: 'error',
        };
      default:
        return {
          title: 'Sécurité des transactions Klef',
          sub: 'Toutes les transactions et versements hôtes sont protégés par notre système de séquestre certifié.',
          icon: Lock,
          tone: 'neutral',
        };
    }
  };

  const config = getNoticeConfig();
  const IconComponent = config.icon;
  const toneStyle = TONE_STYLES[config.tone];

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: toneStyle.bg,
          borderColor: toneStyle.border,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={[styles.iconCircle, { backgroundColor: toneStyle.iconBg }]}>
          <IconComponent size={18} color={toneStyle.iconColor} />
        </View>

        <View style={styles.textCol}>
          <Text style={[styles.title, { color: toneStyle.title }]}>{config.title}</Text>
          <Text style={[styles.subtitle, { color: toneStyle.body }]}>{config.sub}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    ...shadows.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    lineHeight: 18,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    lineHeight: 17,
  },
});
