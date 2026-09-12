import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  RefreshCw,
  ChevronRight,
  Check,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { StatutKyc } from '../../../shared/contracts';

interface MobileProfileKycCardProps {
  statutKyc?: StatutKyc | string;
  onKycClick?: () => void;
}

type Tone = 'neutral' | 'gold' | 'warning' | 'error';
type StepState = 'pending' | 'current' | 'done' | 'failed';

const KYC_CONFIG: Record<
  string,
  { label: string; description: string; cta?: string }
> = {
  NON_VERIFIE: {
    label: 'Non vérifié',
    description: 'Soumettez vos documents pour débloquer toutes les fonctionnalités.',
    cta: 'Vérifier mon identité',
  },
  EN_ATTENTE: {
    label: 'En cours de vérification',
    description: 'Vos documents sont en cours d\'examen par notre équipe.',
  },
  VERIFIE: {
    label: 'Identité vérifiée',
    description: 'Votre identité a été confirmée avec succès.',
  },
  REJETE: {
    label: 'Dossier rejeté',
    description: 'Votre dossier n\'a pas pu être validé. Soumettez à nouveau.',
    cta: 'Soumettre à nouveau',
  },
  A_RENOUVELER: {
    label: 'Renouvellement requis',
    description: 'Vos documents ont expiré. Mettez-les à jour pour continuer.',
    cta: 'Renouveler mes documents',
  },
  SUSPENDU: {
    label: 'Compte suspendu',
    description: 'Votre accès est temporairement suspendu. Contactez le support.',
  },
};

const KYC_TONE: Record<string, Tone> = {
  NON_VERIFIE: 'neutral',
  EN_ATTENTE: 'warning',
  VERIFIE: 'gold',
  REJETE: 'error',
  A_RENOUVELER: 'warning',
  SUSPENDU: 'error',
};

const KYC_PROGRESS: Record<string, [StepState, StepState, StepState]> = {
  NON_VERIFIE: ['current', 'pending', 'pending'],
  EN_ATTENTE: ['done', 'current', 'pending'],
  VERIFIE: ['done', 'done', 'done'],
  REJETE: ['done', 'failed', 'pending'],
  A_RENOUVELER: ['done', 'done', 'current'],
  SUSPENDU: ['done', 'done', 'failed'],
};

const STEP_LABELS = ['Soumission', 'Vérification', 'Validation'];

export function MobileProfileKycCard({
  statutKyc = 'NON_VERIFIE',
  onKycClick,
}: MobileProfileKycCardProps) {
  const currentKey = KYC_CONFIG[statutKyc] ? statutKyc : 'NON_VERIFIE';
  const cfg = KYC_CONFIG[currentKey];
  const tone = KYC_TONE[currentKey] || 'neutral';
  const steps = KYC_PROGRESS[currentKey] || KYC_PROGRESS.NON_VERIFIE;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onKycClick?.();
  };

  // Get status icon component
  const renderStatusIcon = (size = 20, color = colors.text.inverse) => {
    switch (currentKey) {
      case 'VERIFIE':
        return <ShieldCheck size={size} color={colors.gold[300]} />;
      case 'EN_ATTENTE':
        return <Clock size={size} color="#FBBF24" />;
      case 'REJETE':
      case 'SUSPENDU':
        return <ShieldX size={size} color={colors.error[500]} />;
      case 'A_RENOUVELER':
        return <RefreshCw size={size} color="#FBBF24" />;
      default:
        return <ShieldAlert size={size} color={colors.neutral[400]} />;
    }
  };

  return (
    <View style={styles.card}>
      {/* ── 1. En-tête ────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerIconCircle}>
          <Shield size={18} color={colors.forest[700]} />
        </View>

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Vérification d’identité
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Sécurité du compte
          </Text>
        </View>

        {/* Badge Statut Tonalité Web */}
        <View
          style={[
            styles.chip,
            tone === 'gold'
              ? styles.chipGold
              : tone === 'warning'
              ? styles.chipWarning
              : tone === 'error'
              ? styles.chipError
              : styles.chipNeutral,
          ]}
        >
          <View
            style={[
              styles.chipDot,
              tone === 'gold'
                ? styles.dotGold
                : tone === 'warning'
                ? styles.dotWarning
                : tone === 'error'
                ? styles.dotError
                : styles.dotNeutral,
            ]}
          />
          <Text
            style={[
              styles.chipText,
              tone === 'gold'
                ? styles.textGold
                : tone === 'warning'
                ? styles.textWarning
                : tone === 'error'
                ? styles.textError
                : styles.textNeutral,
            ]}
            numberOfLines={1}
          >
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* ── 2. Bloc Statut Inverse (Dark Hero Box) ──────────────────────── */}
      <View style={styles.inverseBox}>
        <View style={styles.glowCircle} />

        <View style={styles.inverseContent}>
          <View style={styles.inverseIconCircle}>
            {renderStatusIcon(22)}
          </View>
          <View style={styles.inverseTextBlock}>
            <Text style={styles.inverseTitle} numberOfLines={1}>
              {cfg.label}
            </Text>
            <Text style={styles.inverseDesc}>
              {cfg.description}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 3. Barre de Progression (3 Étapes Web) ────────────────────── */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressHeaderTitle} numberOfLines={1}>
          Progression
        </Text>

        <View style={styles.stepsRow}>
          {STEP_LABELS.map((label, i) => {
            const state = steps[i];
            const isLast = i === STEP_LABELS.length - 1;

            return (
              <React.Fragment key={label}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      state === 'done'
                        ? styles.circleDone
                        : state === 'current'
                        ? styles.circleCurrent
                        : state === 'failed'
                        ? styles.circleFailed
                        : styles.circlePending,
                    ]}
                  >
                    {state === 'done' && (
                      <Check size={13} color={colors.neutral[0]} strokeWidth={3} />
                    )}
                    {state === 'failed' && (
                      <X size={13} color={colors.neutral[0]} strokeWidth={3} />
                    )}
                    {state === 'current' && <View style={styles.innerDotCurrent} />}
                    {state === 'pending' && <View style={styles.innerDotPending} />}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      state === 'done' || state === 'current'
                        ? styles.stepLabelActive
                        : state === 'failed'
                        ? styles.stepLabelFailed
                        : styles.stepLabelMuted,
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>

                {!isLast && (
                  <View
                    style={[
                      styles.stepLine,
                      state === 'done' ? styles.lineDone : styles.linePending,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* ── 4. Action CTA ou Bannière Finale ────────────────────────────── */}
      {cfg.cta ? (
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={cfg.cta}
          activeOpacity={0.85}
          onPress={handlePress}
          style={styles.ctaButton}
        >
          {renderStatusIcon(16, colors.forest[950])}
          <Text style={styles.ctaButtonText} numberOfLines={1}>
            {cfg.cta}
          </Text>
          <ChevronRight size={16} color={colors.forest[950]} />
        </TouchableOpacity>
      ) : currentKey === 'VERIFIE' ? (
        <View style={styles.confirmedPill}>
          <ShieldCheck size={16} color={colors.gold[700]} />
          <Text style={styles.confirmedText} numberOfLines={1}>
            Identité confirmée par Klef
          </Text>
        </View>
      ) : currentKey === 'EN_ATTENTE' ? (
        <View style={styles.pendingPill}>
          <Clock size={16} color="#B45309" />
          <Text style={styles.pendingText} numberOfLines={1}>
            Vérification en cours par nos équipes
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  // ── Header ────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    flex: 1,
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

  // Chip Statut Tonalités Web
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },

  // Tone Tints
  chipNeutral: { backgroundColor: colors.neutral[100], borderColor: colors.neutral[200] },
  dotNeutral: { backgroundColor: colors.neutral[400] },
  textNeutral: { color: colors.neutral[600] },

  chipGold: { backgroundColor: colors.gold[50], borderColor: colors.gold[200] },
  dotGold: { backgroundColor: colors.gold[400] },
  textGold: { color: colors.gold[700] },

  chipWarning: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  dotWarning: { backgroundColor: '#F59E0B' },
  textWarning: { color: '#B45309' },

  chipError: { backgroundColor: colors.error[50], borderColor: colors.error[500] },
  dotError: { backgroundColor: colors.error[500] },
  textError: { color: colors.error[700] },

  // ── Dark Hero Inverse Box ─────────────────────────────────────────────
  inverseBox: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.inner,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  glowCircle: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(211, 242, 110, 0.08)',
  },
  inverseContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  inverseIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inverseTextBlock: {
    flex: 1,
    gap: 3,
  },
  inverseTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.text.inverseDisplay,
  },
  inverseDesc: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.text.inverseMuted,
    lineHeight: 17,
  },

  // ── Progression Section ───────────────────────────────────────────────
  progressContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  progressHeaderTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
    width: 70,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: colors.forest[800],
    borderColor: colors.forest[800],
  },
  circleCurrent: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.forest[800],
  },
  circleFailed: {
    backgroundColor: colors.error[500],
    borderColor: colors.error[500],
  },
  circlePending: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[200],
  },
  innerDotCurrent: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forest[800],
  },
  innerDotPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[300],
  },

  stepLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    textAlign: 'center',
  },
  stepLabelActive: { color: colors.forest[950] },
  stepLabelFailed: { color: colors.error[700] },
  stepLabelMuted: { color: colors.neutral[400] },

  stepLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginBottom: 20,
  },
  lineDone: { backgroundColor: colors.forest[800] },
  linePending: { backgroundColor: colors.neutral[200] },

  // ── Footer Actions ────────────────────────────────────────────────────
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  ctaButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold[50],
    borderWidth: 1,
    borderColor: colors.gold[200],
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  confirmedText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.gold[700],
  },

  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  pendingText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: '#B45309',
  },
});
