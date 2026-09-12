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
import { Repeat, LogOut, Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { useRoleStore } from '../../../shared/stores/role.store';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { apiClient } from '../../../shared/api/api-client';

const CONFIRMATION_KEYWORD = 'SUPPRIMER';

export function MobileProfileActionsCard() {
  const { activeRole, setActiveRole } = useRoleStore();
  const { logout } = useAuth();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOwner = activeRole === 'PROPRIETAIRE';
  const canDelete = confirmText.trim().toUpperCase() === CONFIRMATION_KEYWORD;

  const handleToggleRole = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const nextRole = isOwner ? 'LOCATAIRE' : 'PROPRIETAIRE';
    setActiveRole(nextRole);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter de Klef ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleOpenDeleteModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setConfirmText('');
    setDeleteError(null);
    setDeleteModalVisible(true);
  };

  const handleCloseDeleteModal = () => {
    if (deleting) return;
    setDeleteModalVisible(false);
    setConfirmText('');
    setDeleteError(null);
  };

  const handleDeleteAccount = async () => {
    if (!canDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

      await apiClient.delete('/users/me');

      setDeleteModalVisible(false);
      logout();
    } catch (err: any) {
      console.error('[MobileProfileActionsCard] Erreur suppression compte:', err);
      const msg =
        err.response?.data?.message ||
        'La suppression n’a pas pu aboutir. Si vous avez une réservation active, réglez-la d’abord.';
      setDeleteError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* Bouton de Déconnexion */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <LogOut size={16} color={colors.forest[950]} />
          <Text style={styles.logoutBtnText} numberOfLines={1}>
            Se déconnecter
          </Text>
        </TouchableOpacity>

        {/* Zone de Danger : Bloc Rouge Suppression */}
        <View style={styles.dangerCard}>
          <View style={styles.dangerHeaderRow}>
            <View style={styles.dangerIconCircle}>
              <AlertTriangle size={16} color={colors.error[700]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerCardTitle} numberOfLines={1}>
                Zone Sensible
              </Text>
              <Text style={styles.dangerCardSubtitle} numberOfLines={1}>
                Suppression définitive du compte et effacement des données
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenDeleteModal}
            style={styles.dangerCardBtn}
            accessibilityRole="button"
            accessibilityLabel="Supprimer mon compte Klef"
          >
            <Trash2 size={15} color={colors.error[700]} />
            <Text style={styles.dangerCardBtnText} numberOfLines={1}>
              Supprimer mon compte Klef
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Modale de Confirmation Web 1:1 ────────────────────────────── */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseDeleteModal}
          />

          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            {/* Header Modale */}
            <View style={styles.sheetHeader}>
              <View style={styles.alertIconCircle}>
                <AlertTriangle size={20} color={colors.error[600]} />
              </View>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                Supprimer votre compte
              </Text>
              <TouchableOpacity
                onPress={handleCloseDeleteModal}
                disabled={deleting}
                style={styles.closeBtn}
              >
                <X size={16} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {/* Explications & Avertissement Web 1:1 */}
            <View style={styles.formStack}>
              <Text style={styles.modalDesc}>
                Cette action est <Text style={styles.boldRed}>définitive</Text>. Vos réservations, annonces, transactions, pièces d’identité et données personnelles seront effacées.
              </Text>

              {/* Box Avertissement Séquestre / Séjour */}
              <View style={styles.warningBox}>
                <ShieldAlert size={15} color="#B45309" style={{ marginTop: 1 }} />
                <Text style={styles.warningBoxText}>
                  Si un séjour est en cours ou des fonds sont en séquestre, réglez-les avant de supprimer votre compte. Sinon, contactez le support.
                </Text>
              </View>

              {/* Champ de Saisie de Confirmation Web ("SUPPRIMER") */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Pour confirmer, saisissez <Text style={styles.boldRed}>{CONFIRMATION_KEYWORD}</Text>
                </Text>
                <TextInput
                  style={[styles.input, canDelete && styles.inputValid]}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder={CONFIRMATION_KEYWORD}
                  placeholderTextColor={colors.neutral[400]}
                  editable={!deleting}
                />
              </View>

              {/* Affichage d'erreur Backend */}
              {deleteError && (
                <View style={styles.errorBox}>
                  <AlertTriangle size={14} color={colors.error[700]} />
                  <Text style={styles.errorBoxText}>{deleteError}</Text>
                </View>
              )}

              {/* Bouton de Suppression Définitive */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleDeleteAccount}
                disabled={!canDelete || deleting}
                style={[
                  styles.confirmDeleteBtn,
                  canDelete ? styles.confirmDeleteBtnActive : styles.confirmDeleteBtnDisabled,
                ]}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.neutral[0]} />
                ) : (
                  <>
                    <Trash2 size={16} color={canDelete ? colors.neutral[0] : colors.neutral[400]} />
                    <Text
                      style={[
                        styles.confirmDeleteText,
                        !canDelete && styles.confirmDeleteTextDisabled,
                      ]}
                      numberOfLines={1}
                    >
                      Supprimer définitivement
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Bouton d'Annulation */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCloseDeleteModal}
                disabled={deleting}
                style={styles.cancelSheetBtn}
              >
                <Text style={styles.cancelSheetText} numberOfLines={1}>
                  Conserver mon compte
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  switchBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  logoutBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  // Zone de Danger Red Card
  dangerCard: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
    marginTop: 4,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dangerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerCardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.error[700],
  },
  dangerCardSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.error[700],
    opacity: 0.85,
  },
  dangerCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  dangerCardBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.error[700],
  },

  // Modale Bottom Sheet Web 1:1
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
    gap: 14,
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
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  alertIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  formStack: { gap: 12 },
  modalDesc: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  boldRed: {
    fontFamily: typography.fontBodyBold,
    color: colors.error[700],
  },

  // Warning Box
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.inner,
    padding: 10,
  },
  warningBoxText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },

  fieldBlock: { gap: 6 },
  fieldLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.forest[950],
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
    letterSpacing: 1,
  },
  inputValid: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[50],
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    borderRadius: radius.inner,
    padding: 10,
  },
  errorBoxText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.error[700],
    flex: 1,
    lineHeight: 15,
  },

  confirmDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  confirmDeleteBtnActive: {
    backgroundColor: colors.error[600],
    ...shadows.action,
  },
  confirmDeleteBtnDisabled: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  confirmDeleteText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },
  confirmDeleteTextDisabled: {
    color: colors.neutral[400],
  },

  cancelSheetBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelSheetText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.neutral[600],
  },
});
