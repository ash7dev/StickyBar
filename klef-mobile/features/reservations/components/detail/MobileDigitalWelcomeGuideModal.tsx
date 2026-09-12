import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  Wifi,
  Key,
  MapPin,
  Copy,
  Check,
  X,
  Smartphone,
  Navigation,
  ShieldCheck,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { ReservationLogement } from '../../types/reservation-detail.types';

interface MobileDigitalWelcomeGuideModalProps {
  visible: boolean;
  onClose: () => void;
  logement: ReservationLogement & {
    nomReseauWifi?: string | null;
    codeWifi?: string | null;
    instructionsDigicode?: string | null;
    instructionsAcces?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
  };
}

export function MobileDigitalWelcomeGuideModal({
  visible,
  onClose,
  logement,
}: MobileDigitalWelcomeGuideModalProps) {
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!visible) return null;

  const lat = logement.latitude != null ? Number(logement.latitude) : null;
  const lng = logement.longitude != null ? Number(logement.longitude) : null;

  const copyText = async (text: string, type: 'wifi' | 'code') => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (type === 'wifi') {
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const openGoogleMaps = () => {
    const url = lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${logement.adresse || ''}, ${logement.ville}`)}`;
    Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible d’ouvrir Google Maps.'));
  };

  const openWaze = () => {
    const url = lat && lng
      ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(`${logement.adresse || ''}, ${logement.ville}`)}&navigate=yes`;
    Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible d’ouvrir Waze.'));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Smartphone size={20} color={colors.forest[700]} />
            </View>
            <View style={styles.headerTextStack}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.headerTitle}>Livret d’Accueil Digital</Text>
                <View style={styles.badgeConfirmed}>
                  <ShieldCheck size={10} color={colors.forest[800]} />
                  <Text style={styles.badgeConfirmedText}>Vérifié</Text>
                </View>
              </View>
              <Text style={styles.headerSub}>{logement.titre} · {logement.ville}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Section 1 : Wi-Fi */}
            {(logement.nomReseauWifi || logement.codeWifi) && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <Wifi size={16} color={colors.forest[700]} />
                  <Text style={styles.sectionTitle}>Connexion Wi-Fi du Logement</Text>
                </View>

                {logement.nomReseauWifi ? (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Nom du réseau (SSID)</Text>
                    <Text style={styles.infoValBold}>{logement.nomReseauWifi}</Text>
                  </View>
                ) : null}

                {logement.codeWifi ? (
                  <View style={[styles.infoCard, styles.infoCardRow]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>Mot de passe Wi-Fi</Text>
                      <Text style={styles.infoValCode}>{logement.codeWifi}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => copyText(logement.codeWifi!, 'wifi')}
                      style={styles.copyBtn}
                    >
                      {copiedWifi ? (
                        <Check size={14} color={colors.forest[800]} />
                      ) : (
                        <Copy size={14} color={colors.forest[800]} />
                      )}
                      <Text style={styles.copyBtnText}>{copiedWifi ? 'Copié !' : 'Copier'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}

            {/* Section 2 : Digicode & Accès */}
            {(logement.instructionsDigicode || logement.instructionsAcces) && (
              <View style={styles.sectionBoxAlt}>
                <View style={styles.sectionTitleRow}>
                  <Key size={16} color={colors.forest[700]} />
                  <Text style={styles.sectionTitle}>Digicode & Clés</Text>
                </View>

                {logement.instructionsDigicode ? (
                  <View style={[styles.infoCard, styles.infoCardRow]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>Code Boîte à Clés / Digicode</Text>
                      <Text style={styles.infoValCodeBig}>{logement.instructionsDigicode}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => copyText(logement.instructionsDigicode!, 'code')}
                      style={styles.copyBtn}
                    >
                      {copiedCode ? (
                        <Check size={14} color={colors.forest[800]} />
                      ) : (
                        <Copy size={14} color={colors.forest[800]} />
                      )}
                      <Text style={styles.copyBtnText}>{copiedCode ? 'Copié !' : 'Copier'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {logement.instructionsAcces ? (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Instructions d’arrivée</Text>
                    <Text style={styles.infoTextBody}>{logement.instructionsAcces}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Section 3 : Localisation & GPS 1-clic */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionTitleRow}>
                <MapPin size={16} color={colors.forest[700]} />
                <Text style={styles.sectionTitle}>Adresse & GPS</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTextBody}>
                  📍 {logement.adresse || logement.quartier || ''}, {logement.ville}
                </Text>
              </View>

              <View style={styles.gpsButtonsRow}>
                <TouchableOpacity onPress={openGoogleMaps} style={styles.gpsBtn}>
                  <Navigation size={14} color={colors.forest[800]} />
                  <Text style={styles.gpsBtnText}>Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={openWaze} style={styles.gpsBtn}>
                  <Navigation size={14} color={colors.forest[800]} />
                  <Text style={styles.gpsBtnText}>Waze GPS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeFullBtn}>
            <Text style={styles.closeFullBtnText}>Fermer le livret</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: 20,
    maxHeight: '88%',
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextStack: {
    flex: 1,
    gap: 2,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  badgeConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.forest[50],
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  badgeConfirmedText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9,
    color: colors.forest[900],
  },
  headerSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  closeBtn: {
    padding: 6,
  },

  scrollBody: {
    gap: 14,
    paddingBottom: 10,
  },
  sectionBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    gap: 10,
  },
  sectionBoxAlt: {
    backgroundColor: colors.forest[50],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.forest[100],
    padding: 14,
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  infoCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 12,
    gap: 4,
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  infoValBold: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  infoValCode: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[900],
    letterSpacing: 0.8,
  },
  infoValCodeBig: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
    letterSpacing: 1.5,
  },
  infoTextBody: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[800],
    lineHeight: 18,
  },

  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  copyBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[900],
  },

  gpsButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  gpsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  gpsBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[900],
  },

  closeFullBtn: {
    backgroundColor: colors.lime[400],
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  closeFullBtnText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13,
    color: colors.forest[950],
  },
});
