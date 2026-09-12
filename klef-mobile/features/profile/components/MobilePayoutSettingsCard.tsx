import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Wallet, Smartphone, Edit3, X, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { apiClient } from '../../../shared/api/api-client';

interface MobilePayoutSettingsCardProps {
  telephoneInitial?: string | null;
  methodeInitial?: 'WAVE' | 'ORANGE_MONEY' | string;
  onUpdated?: () => void;
}

export function MobilePayoutSettingsCard({
  telephoneInitial,
  methodeInitial = 'WAVE',
  onUpdated,
}: MobilePayoutSettingsCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [methode, setMethode] = useState<'WAVE' | 'ORANGE_MONEY'>(
    methodeInitial === 'ORANGE_MONEY' ? 'ORANGE_MONEY' : 'WAVE'
  );
  const [telephone, setTelephone] = useState(telephoneInitial || '');
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTelephone(telephoneInitial || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!telephone.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre numéro Mobile Money pour recevoir vos fonds.');
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      await apiClient.patch('/users/payout-settings', {
        methode,
        telephone: telephone.trim(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setModalVisible(false);
      onUpdated?.();
    } catch (err: any) {
      console.error('[MobilePayoutSettingsCard] Erreur enregistrement coordonnées:', err);
      const msg = err.response?.data?.message || 'Impossible de mettre à jour vos coordonnées de versement.';
      Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  const providerLabel = methode === 'ORANGE_MONEY' ? 'Orange Money' : 'Wave Mobile Money';

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Wallet size={18} color={colors.forest[700]} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Coordonnées de Versement</Text>
            <Text style={styles.headerSubtitle}>Compte de réception des loyers & remboursements</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={handleOpenEdit} style={styles.editBtn}>
            <Edit3 size={14} color={colors.forest[800]} />
            <Text style={styles.editBtnText}>Modifier</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.payoutDisplay}>
          <View style={styles.providerRow}>
            <View style={styles.providerBadge}>
              <Smartphone size={14} color={methode === 'ORANGE_MONEY' ? '#FF6600' : '#1DC4FF'} />
              <Text style={styles.providerText}>{providerLabel}</Text>
            </View>
            <View style={styles.securedBadge}>
              <ShieldCheck size={12} color={colors.forest[600]} />
              <Text style={styles.securedText}>Actif & Vérifié</Text>
            </View>
          </View>

          <Text style={styles.phoneText}>
            📞 {telephoneInitial || 'Aucun numéro configuré'}
          </Text>
        </View>
      </View>

      {/* Modale d'Édition du Compte de Versement */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Coordonnées de versement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={16} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.formStack}>
              <Text style={styles.sectionLabel}>Sélectionnez l'opérateur Mobile Money</Text>

              {/* Sélection Opérateur */}
              <View style={styles.providerGrid}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setMethode('WAVE')}
                  style={[styles.providerTile, methode === 'WAVE' && styles.providerTileWave]}
                >
                  <Smartphone size={18} color="#1DC4FF" />
                  <Text style={styles.tileTitle}>Wave Mobile</Text>
                  <Text style={styles.tileSub}>0% frais de transfert</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setMethode('ORANGE_MONEY')}
                  style={[styles.providerTile, methode === 'ORANGE_MONEY' && styles.providerTileOrange]}
                >
                  <Smartphone size={18} color="#FF6600" />
                  <Text style={styles.tileTitle}>Orange Money</Text>
                  <Text style={styles.tileSub}>Sénégal & Région</Text>
                </TouchableOpacity>
              </View>

              {/* Numéro du compte */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Numéro du compte Mobile Money *</Text>
                <TextInput
                  style={styles.input}
                  value={telephone}
                  onChangeText={setTelephone}
                  keyboardType="phone-pad"
                  placeholder="+221 77 000 00 00"
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                disabled={saving}
                style={[styles.saveBtn, saving && styles.btnDisabled]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.forest[950]} />
                ) : (
                  <>
                    <CheckCircle2 size={16} color={colors.forest[950]} />
                    <Text style={styles.saveBtnText}>Enregistrer le compte</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  editBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[800],
  },

  payoutDisplay: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  providerText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  securedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[50],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  securedText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 10,
    color: colors.forest[700],
  },
  phoneText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.forest[900],
  },

  // Modale
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: { flex: 1 },
  modalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  sheetTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  formStack: { gap: 14 },
  sectionLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.forest[900],
  },
  providerGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  providerTile: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    gap: 3,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  providerTileWave: {
    borderColor: '#1DC4FF',
    backgroundColor: 'rgba(29, 196, 255, 0.06)',
  },
  providerTileOrange: {
    borderColor: '#FF6600',
    backgroundColor: 'rgba(255, 102, 0, 0.06)',
  },
  tileTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
    marginTop: 4,
  },
  tileSub: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[500],
  },

  fieldBlock: { gap: 5 },
  fieldLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.forest[900],
  },
  input: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.forest[950],
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginTop: 8,
    ...shadows.action,
  },
  saveBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  btnDisabled: { opacity: 0.7 },
});
