import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  UserCheck,
  Smartphone,
  CreditCard,
  Lock,
  ShieldAlert,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { GateStep, GateBlock } from '../../hooks/useGatedAction';
import { StepProfile } from './steps/StepProfile';
import { StepPhoneVerify } from './steps/StepPhoneVerify';
import { StepKyc } from './steps/StepKyc';

interface TenantActionGateModalProps {
  visible: boolean;
  steps: GateStep[];
  block: GateBlock;
  onComplete: () => void;
  onCancel: () => void;
}

const STEP_META: Record<
  GateStep,
  {
    title: string;
    subtitle: string;
    icon: typeof UserCheck;
    shortLabel: string;
  }
> = {
  profile: {
    title: 'Complétez votre profil',
    subtitle:
      'Votre prénom, nom et date de naissance sont requis pour réserver.',
    icon: UserCheck,
    shortLabel: 'Profil',
  },
  phone: {
    title: 'Vérifiez votre numéro',
    subtitle: 'Un code SMS à 6 chiffres sera envoyé pour confirmer votre compte.',
    icon: Smartphone,
    shortLabel: 'Téléphone',
  },
  kyc: {
    title: 'Pièce d\'identité (CNI / Passeport)',
    subtitle:
      'Ajoutez la face avant et la face arrière de votre pièce d\'identité.',
    icon: CreditCard,
    shortLabel: 'Identité',
  },
};

export function TenantActionGateModal({
  visible,
  steps = [],
  block = null,
  onComplete,
  onCancel,
}: TenantActionGateModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    setCurrentIdx(0);
  }, [steps.length]);

  const handleStepDone = () => {
    if (currentIdx < steps.length - 1) {
      setCurrentIdx((idx) => idx + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[currentIdx];
  const meta = currentStep ? STEP_META[currentStep] : null;
  const StepIcon = meta?.icon;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropPress}
          activeOpacity={1}
          onPress={onCancel}
        />

        <View style={styles.sheetContainer}>
          {/* Handle */}
          <View style={styles.dragHandle} />

          {/* Bouton fermer */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onCancel}
            style={styles.closeBtn}
          >
            <X size={18} color={colors.neutral[700]} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {block === 'kyc_suspended' ? (
              /* Écran de suspension */
              <View style={styles.blockContainer}>
                <View style={styles.blockIconCircle}>
                  <ShieldAlert size={28} color={colors.error[600]} />
                </View>
                <Text style={styles.blockTitle}>Compte suspendu</Text>
                <Text style={styles.blockText}>
                  Votre compte a été temporairement suspendu. Veuillez contacter le support Klef pour régulariser votre situation.
                </Text>
              </View>
            ) : meta && StepIcon ? (
              <>
                {/* Stepper horizontal si plusieurs étapes */}
                {steps.length > 1 && (
                  <View style={styles.stepperNav}>
                    {steps.map((stepKey, idx) => {
                      const stepMeta = STEP_META[stepKey];
                      const Icon = stepMeta.icon;
                      const isDone = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <React.Fragment key={stepKey}>
                          <View style={styles.stepperItem}>
                            <View
                              style={[
                                styles.stepCircle,
                                isDone && styles.stepCircleDone,
                                isCurrent && styles.stepCircleCurrent,
                              ]}
                            >
                              <Icon
                                size={14}
                                color={
                                  isDone
                                    ? colors.neutral[0]
                                    : isCurrent
                                    ? colors.forest[700]
                                    : colors.neutral[400]
                                }
                              />
                            </View>
                            <Text
                              style={[
                                styles.stepLabel,
                                (isDone || isCurrent) && styles.stepLabelActive,
                              ]}
                            >
                              {stepMeta.shortLabel}
                            </Text>
                          </View>
                          {idx < steps.length - 1 && (
                            <View
                              style={[
                                styles.stepperLine,
                                idx < currentIdx && styles.stepperLineActive,
                              ]}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </View>
                )}

                {/* Badge Étape X sur Y */}
                <View style={styles.badgeRow}>
                  <View style={styles.stepBadge}>
                    <Lock size={10} color={colors.forest[700]} />
                    <Text style={styles.stepBadgeText}>
                      Étape {currentIdx + 1} sur {steps.length}
                    </Text>
                  </View>
                </View>

                {/* Titre & Sous-titre de l'étape */}
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconCircle}>
                    <StepIcon size={24} color={colors.lime[300]} />
                  </View>
                  <Text style={styles.stepTitle}>{meta.title}</Text>
                  <Text style={styles.stepSubtitle}>{meta.subtitle}</Text>
                </View>

                {/* Composant de l'étape courante */}
                <View style={styles.stepBody}>
                  {currentStep === 'profile' && (
                    <StepProfile onDone={handleStepDone} />
                  )}
                  {currentStep === 'phone' && (
                    <StepPhoneVerify onDone={handleStepDone} />
                  )}
                  {currentStep === 'kyc' && (
                    <StepKyc onDone={handleStepDone} />
                  )}
                </View>
              </>
            ) : null}

            {/* Note de sécurité */}
            <View style={styles.securityFooter}>
              <Lock size={11} color={colors.neutral[500]} />
              <Text style={styles.securityFooterText}>
                Vos données sont chiffrées et sécurisées par Klef
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.70)',
    justifyContent: 'flex-end',
  },
  backdropPress: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 10,
    paddingBottom: 24,
    ...shadows.lg,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    padding: 18,
    gap: 12,
  },
  stepperNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  stepperItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCurrent: {
    borderColor: colors.forest[600],
    backgroundColor: colors.forest[50],
  },
  stepCircleDone: {
    borderColor: colors.forest[600],
    backgroundColor: colors.forest[600],
  },
  stepLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[500],
  },
  stepLabelActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.neutral[200],
    marginHorizontal: 8,
    marginBottom: 14,
  },
  stepperLineActive: {
    backgroundColor: colors.forest[600],
  },
  badgeRow: {
    alignItems: 'center',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[50],
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  stepBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[800],
    letterSpacing: 0.4,
  },
  stepHeader: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 4,
  },
  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.forest[900],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
    textAlign: 'center',
  },
  stepSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 17,
  },
  stepBody: {
    marginTop: 4,
  },

  // Block screen
  blockContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  blockIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.error[700],
  },
  blockText: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
  },

  // Security footer
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
  },
  securityFooterText: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
  },
});
