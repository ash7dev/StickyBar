import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Repeat, ArrowLeftRight, Sparkles, X, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { useSwitchRole } from '../../../features/auth/hooks/useSwitchRole';

export function MobileActiveRoleCard() {
  const { activeRole, isSwitching, error, switchRole } = useSwitchRole();
  const [modalVisible, setModalVisible] = useState(false);
  const isOwner = activeRole === 'PROPRIETAIRE';
  const targetRole = isOwner ? 'LOCATAIRE' : 'PROPRIETAIRE';

  const handleOpenModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    setModalVisible(true);
  };

  const handleConfirmSwitch = async () => {
    const success = await switchRole(targetRole);
    if (success) {
      setModalVisible(false);
    }
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <ArrowLeftRight size={18} color={colors.forest[700]} />
          </View>

          <View style={styles.textBlock}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.title} numberOfLines={1}>
                Espace Actif
              </Text>
              <View style={styles.activePill}>
                <Sparkles size={11} color={colors.forest[800]} />
                <Text style={styles.activePillText} numberOfLines={1}>
                  {isOwner ? 'Hôte' : 'Voyageur'}
                </Text>
              </View>
            </View>

            <Text style={styles.subtitle} numberOfLines={1}>
              {isOwner
                ? 'Gérez vos annonces et réservations reçues'
                : 'Explorez et réservez des logements d’exception'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenModal}
          style={styles.switchBtn}
          accessibilityRole="button"
          accessibilityLabel={`Basculer en mode ${isOwner ? 'Voyageur' : 'Hôte'}`}
        >
          <Repeat size={14} color={colors.forest[950]} />
          <Text style={styles.switchBtnText} numberOfLines={1}>
            Passer en mode {isOwner ? 'Voyageur' : 'Hôte'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Modale Centrée de Confirmation de Bascule de Rôle ─────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isSwitching && setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isSwitching && setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <View style={styles.modalHeader}>
              <View style={styles.alertIconCircle}>
                <ArrowLeftRight size={18} color={colors.forest[800]} />
              </View>
              <Text style={styles.modalTitle} numberOfLines={1}>
                Passer en mode {isOwner ? 'Voyageur' : 'Hôte'} ?
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isSwitching}
                style={styles.closeBtn}
              >
                <X size={16} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {/* Description Minimale */}
            <View style={styles.formStack}>
              <Text style={styles.modalDesc}>
                {isOwner
                  ? 'Basculer vers l’espace Voyageur pour explorer et réserver des logements.'
                  : 'Basculer vers l’espace Hôte pour gérer vos logements, tarifs et réservations.'}
              </Text>

              {/* Message d'Erreur si échec backend */}
              {error && (
                <View style={styles.errorBox}>
                  <ShieldAlert size={14} color={colors.error[700]} />
                  <Text style={styles.errorBoxText}>{error}</Text>
                </View>
              )}

              {/* Bouton de confirmation */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmSwitch}
                disabled={isSwitching}
                style={styles.confirmBtn}
              >
                {isSwitching ? (
                  <ActivityIndicator color={colors.forest[950]} />
                ) : (
                  <>
                    <Repeat size={16} color={colors.forest[950]} />
                    <Text style={styles.confirmBtnText} numberOfLines={1}>
                      Confirmer et basculer
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Bouton d'annulation */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setModalVisible(false)}
                disabled={isSwitching}
                style={styles.cancelSheetBtn}
              >
                <Text style={styles.cancelSheetText} numberOfLines={1}>
                  Rester en mode {isOwner ? 'Hôte' : 'Voyageur'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
  textBlock: {
    flex: 1,
    gap: 2,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
    flex: 1,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[100],
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  activePillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[800],
  },

  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  switchBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  // Modale Centrée
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.60)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.float,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16.5,
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

  formStack: {
    gap: 12,
  },
  modalDesc: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[700],
    lineHeight: 18,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    borderRadius: radius.inner,
    padding: 10,
  },
  infoBoxText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[800],
    flex: 1,
    lineHeight: 15,
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

  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginTop: 4,
    ...shadows.action,
  },
  confirmBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
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
