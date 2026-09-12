import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  Wifi,
  KeyRound,
  Zap,
  ShieldAlert,
  Copy,
  Check,
  FileText,
  Lock,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

export interface MobileOwnerDetailGuestbookProps {
  nomReseauWifi?: string;
  wifiSsid?: string;
  codeWifi?: string;
  wifiPassword?: string;
  instructionsDigicode?: string;
  codeDigicode?: string;
  instructionsAcces?: string;
  regimeElectricite?: string;
  detailsElectricite?: string;
  reglesMaison?: string;
}

export function MobileOwnerDetailGuestbook({
  nomReseauWifi,
  wifiSsid,
  codeWifi,
  wifiPassword,
  instructionsDigicode,
  codeDigicode,
  instructionsAcces,
  regimeElectricite,
  detailsElectricite,
  reglesMaison,
}: MobileOwnerDetailGuestbookProps) {
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedDigicode, setCopiedDigicode] = useState(false);

  const ssid = nomReseauWifi || wifiSsid || '';
  const password = codeWifi || wifiPassword || '';
  const digicode = instructionsDigicode || codeDigicode || '';

  const copyToClipboard = async (text: string, type: 'wifi' | 'digicode') => {
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await Clipboard.setStringAsync(text);

    if (type === 'wifi') {
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2500);
    } else {
      setCopiedDigicode(true);
      setTimeout(() => setCopiedDigicode(false), 2500);
    }
  };

  const getElectriciteLabel = () => {
    switch (regimeElectricite) {
      case 'INCLUS':
        return '100% Inclus dans le séjour';
      case 'FORFAIT_RECHARGE':
        return 'Recharge initiale offerte';
      case 'WOYOFAL_LOCATAIRE':
        return 'Woyofal à la charge du voyageur';
      default:
        return regimeElectricite || 'Consommation standard';
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.markerCircle}>
            <FileText size={16} color={colors.forest[800]} />
          </View>
          <Text style={styles.cardTitle}>Livret Digital & Accès</Text>
        </View>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>Confidentiel</Text>
        </View>
      </View>

      {/* ── Wi-Fi Section ───────────────────────────────────────────── */}
      <View style={styles.sectionBox}>
        <View style={styles.boxHeaderRow}>
          <View style={styles.boxHeaderLeft}>
            <Wifi size={15} color={colors.forest[600]} />
            <Text style={styles.boxTitle} numberOfLines={1}>Accès Wi-Fi</Text>
          </View>
        </View>

        {ssid || password ? (
          <View style={styles.credentialsStack}>
            {ssid ? (
              <View style={styles.credentialRow}>
                <Text style={styles.fieldLabel}>Réseau (SSID) :</Text>
                <Text style={styles.fieldValue} numberOfLines={1} ellipsizeMode="tail">
                  {ssid}
                </Text>
              </View>
            ) : null}

            {password ? (
              <View style={styles.passwordCard}>
                <View style={styles.passwordLeft}>
                  <Text style={styles.passwordLabel}>Mot de passe :</Text>
                  <Text style={styles.passwordValue} numberOfLines={1} ellipsizeMode="middle">
                    {password}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => copyToClipboard(password, 'wifi')}
                  style={[styles.copyBtn, copiedWifi && styles.copyBtnSuccess]}
                >
                  {copiedWifi ? (
                    <>
                      <Check size={12} color={colors.forest[800]} />
                      <Text style={styles.copyBtnTextSuccess}>Copié !</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={12} color={colors.forest[950]} />
                      <Text style={styles.copyBtnText}>Copier</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptyText}>Aucun identifiant Wi-Fi renseigné.</Text>
        )}
      </View>

      {/* ── Digicode & Key Access ────────────────────────────────────── */}
      <View style={styles.sectionBox}>
        <View style={styles.boxHeaderRow}>
          <View style={styles.boxHeaderLeft}>
            <KeyRound size={15} color={colors.forest[600]} />
            <Text style={styles.boxTitle} numberOfLines={1}>Digicode & Accès</Text>
          </View>

          {digicode ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => copyToClipboard(digicode, 'digicode')}
              style={[styles.copyBtnSmall, copiedDigicode && styles.copyBtnSuccess]}
            >
              {copiedDigicode ? (
                <Check size={12} color={colors.forest[800]} />
              ) : (
                <Copy size={12} color={colors.forest[950]} />
              )}
              <Text style={copiedDigicode ? styles.copyBtnTextSuccess : styles.copyBtnText}>
                {copiedDigicode ? 'Copié' : 'Copier'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {digicode || instructionsAcces ? (
          <View style={styles.credentialsStack}>
            {digicode ? (
              <View style={styles.credentialRow}>
                <Text style={styles.fieldLabel}>Code Digicode :</Text>
                <Text style={styles.digicodeHighlight}>{digicode}</Text>
              </View>
            ) : null}

            {instructionsAcces ? (
              <Text style={styles.instructionsText}>{instructionsAcces}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptyText}>Instructions d'accès non renseignées.</Text>
        )}
      </View>

      {/* ── Électricité Woyofal ──────────────────────────────────────── */}
      {regimeElectricite ? (
        <View style={styles.electriciteBox}>
          <View style={styles.electriciteHeaderRow}>
            <Zap size={16} color="#B45309" fill="#FBBF24" />
            <Text style={styles.electriciteTitle} numberOfLines={2}>
              Électricité : {getElectriciteLabel()}
            </Text>
          </View>
          {detailsElectricite ? (
            <Text style={styles.electriciteText}>{detailsElectricite}</Text>
          ) : null}
        </View>
      ) : null}

      {/* ── House Rules ─────────────────────────────────────────────── */}
      <View style={styles.sectionBox}>
        <View style={styles.boxHeaderLeft}>
          <ShieldAlert size={15} color={colors.forest[600]} />
          <Text style={styles.boxTitle}>Règlement intérieur</Text>
        </View>
        {reglesMaison ? (
          <Text style={styles.instructionsText}>{reglesMaison}</Text>
        ) : (
          <Text style={styles.emptyText}>Règlement intérieur standard appliqué.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexShrink: 1,
  },
  markerCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
    flex: 1,
    flexShrink: 1,
  },
  proBadge: {
    backgroundColor: colors.forest[50],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  proBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: colors.forest[800],
  },

  // Section Box
  sectionBox: {
    backgroundColor: colors.neutral[50],
    padding: 14,
    borderRadius: radius.inner,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  boxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  boxHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    flexShrink: 1,
  },
  boxTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
    flex: 1,
  },

  // Credentials
  credentialsStack: {
    gap: 8,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  fieldLabel: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
  fieldValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
    flex: 1,
  },
  digicodeHighlight: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[950],
    letterSpacing: 1,
    backgroundColor: colors.neutral[0],
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  // Password Card
  passwordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 8,
  },
  passwordLeft: {
    flex: 1,
    gap: 2,
  },
  passwordLabel: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
  },
  passwordValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime[400],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  copyBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime[400],
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  copyBtnSuccess: {
    backgroundColor: colors.forest[100],
  },
  copyBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },
  copyBtnTextSuccess: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[800],
  },

  instructionsText: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  emptyText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },

  // Electricité Woyofal Box
  electriciteBox: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: radius.inner,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  electriciteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  electriciteTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: '#92400E',
    flex: 1,
    flexShrink: 1,
  },
  electriciteText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
});
