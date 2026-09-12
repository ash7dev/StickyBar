import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit3,
  X,
  AlertCircle,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { apiClient } from '../../../shared/api/api-client';

interface MobileProfileInfoCardProps {
  user?: {
    prenom?: string;
    nom?: string;
    email?: string | null;
    telephone?: string | null;
    dateNaissance?: string | null;
  } | null;
  onProfileUpdated?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Formate une date ISO ou YYYY-MM-DD en date civile française lisible (ex: 15 mai 1990) */
function formatDateCivile(iso?: string | null) {
  if (!iso) return null;
  const clean = iso.slice(0, 10);
  const [y, m, d] = clean.split('-').map(Number);
  if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return null;
  try {
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return clean;
  }
}

function FieldShell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.fieldShell}>
      <View style={styles.fieldShellIconCircle}>
        <Icon size={15} color={colors.forest[700]} />
      </View>
      <View style={styles.fieldShellContent}>
        <Text style={styles.fieldShellLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={[styles.fieldShellValue, !value && styles.fieldShellValueEmpty]}
          numberOfLines={1}
        >
          {value || 'Non renseigné'}
        </Text>
      </View>
    </View>
  );
}

export function MobileProfileInfoCard({ user, onProfileUpdated }: MobileProfileInfoCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [nom, setNom] = useState(user?.nom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [dateNaissance, setDateNaissance] = useState(
    user?.dateNaissance ? user.dateNaissance.slice(0, 10) : ''
  );
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    prenom?: string;
    nom?: string;
    email?: string;
    dateNaissance?: string;
  }>({});

  const nomRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const telephoneRef = useRef<TextInput>(null);
  const dateNaissanceRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!modalVisible) {
      setPrenom(user?.prenom || '');
      setNom(user?.nom || '');
      setEmail(user?.email || '');
      setTelephone(user?.telephone || '');
      setDateNaissance(user?.dateNaissance ? user.dateNaissance.slice(0, 10) : '');
      setApiError(null);
      setErrors({});
    }
  }, [user, modalVisible]);

  const initialDate = user?.dateNaissance ? user.dateNaissance.slice(0, 10) : '';

  const hasChanges =
    prenom.trim() !== (user?.prenom || '') ||
    nom.trim() !== (user?.nom || '') ||
    (email.trim() || null) !== (user?.email || null) ||
    (telephone.trim() || null) !== (user?.telephone || null) ||
    (dateNaissance.trim() || null) !== (initialDate || null);

  const handleOpenEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setErrors({});
    setApiError(null);
    setPrenom(user?.prenom || '');
    setNom(user?.nom || '');
    setEmail(user?.email || '');
    setTelephone(user?.telephone || '');
    setDateNaissance(user?.dateNaissance ? user.dateNaissance.slice(0, 10) : '');
    setModalVisible(true);
  };

  const handleClose = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!prenom.trim()) next.prenom = 'Le prénom est requis';
    if (!nom.trim()) next.nom = 'Le nom de famille est requis';
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      next.email = 'Adresse email invalide';
    }
    if (dateNaissance.trim() && !DATE_REGEX.test(dateNaissance.trim())) {
      next.dateNaissance = 'Format invalide (AAAA-MM-JJ)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setApiError(null);
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      await apiClient.patch('/users/me', {
        prenom: prenom.trim() || null,
        nom: nom.trim() || null,
        email: email.trim() || null,
        telephone: telephone.trim() || null,
        dateNaissance: dateNaissance.trim() || null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setModalVisible(false);
      onProfileUpdated?.();
    } catch (err: any) {
      console.error('[MobileProfileInfoCard] Erreur enregistrement profil:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const msg =
        err?.response?.data?.message ||
        (err?.message === 'Network Error'
          ? 'Vérifiez votre connexion internet.'
          : 'Impossible de sauvegarder vos informations. Réessayez.');
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = formatDateCivile(user?.dateNaissance);

  return (
    <>
      <View style={styles.card}>
        {/* En-tête Web Style */}
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <User size={18} color={colors.forest[700]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Informations personnelles
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Identité et coordonnées
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenEdit}
            style={styles.editBtn}
            accessibilityRole="button"
            accessibilityLabel="Modifier mes informations personnelles"
          >
            <Edit3 size={14} color={colors.forest[800]} />
            <Text style={styles.editBtnText} numberOfLines={1}>
              Modifier
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grille des Champs Web (FieldShell) */}
        <View style={styles.fieldsGrid}>
          <FieldShell icon={User} label="Prénom" value={user?.prenom} />
          <FieldShell icon={User} label="Nom de famille" value={user?.nom} />
          <FieldShell icon={Mail} label="Adresse email" value={user?.email} />
          <FieldShell icon={Phone} label="Téléphone" value={user?.telephone} />
          <FieldShell icon={Calendar} label="Date de naissance" value={formattedDate} />
        </View>
      </View>

      {/* Modale Bottom Sheet d'Édition du Profil */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          />

          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Modifier mes coordonnées</Text>
                <Text style={styles.sheetSubline}>
                  Mettez à jour vos données personnelles confidentielles
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Fermer la fenêtre"
              >
                <X size={16} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {apiError && (
              <View style={styles.apiErrorBox}>
                <AlertCircle size={15} color={colors.error[600]} />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            )}

            <ScrollView
              style={styles.formStack}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Prénom */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Prénom *</Text>
                <TextInput
                  style={[styles.input, errors.prenom && styles.inputError]}
                  value={prenom}
                  onChangeText={(t) => {
                    setPrenom(t);
                    if (errors.prenom) setErrors((e) => ({ ...e, prenom: undefined }));
                  }}
                  placeholder="Votre prénom"
                  placeholderTextColor={colors.neutral[400]}
                  textContentType="givenName"
                  autoComplete="name-given"
                  returnKeyType="next"
                  onSubmitEditing={() => nomRef.current?.focus()}
                  editable={!saving}
                  maxLength={60}
                />
                {errors.prenom && <ErrorText text={errors.prenom} />}
              </View>

              {/* Nom de famille */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Nom de famille *</Text>
                <TextInput
                  ref={nomRef}
                  style={[styles.input, errors.nom && styles.inputError]}
                  value={nom}
                  onChangeText={(t) => {
                    setNom(t);
                    if (errors.nom) setErrors((e) => ({ ...e, nom: undefined }));
                  }}
                  placeholder="Votre nom"
                  placeholderTextColor={colors.neutral[400]}
                  textContentType="familyName"
                  autoComplete="name-family"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  editable={!saving}
                  maxLength={60}
                />
                {errors.nom && <ErrorText text={errors.nom} />}
              </View>

              {/* Email */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Adresse email</Text>
                <TextInput
                  ref={emailRef}
                  style={[styles.input, errors.email && styles.inputError]}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="exemple@domaine.com"
                  placeholderTextColor={colors.neutral[400]}
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => telephoneRef.current?.focus()}
                  editable={!saving}
                  maxLength={120}
                />
                {errors.email && <ErrorText text={errors.email} />}
              </View>

              {/* Téléphone */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
                <TextInput
                  ref={telephoneRef}
                  style={styles.input}
                  value={telephone}
                  onChangeText={setTelephone}
                  keyboardType="phone-pad"
                  placeholder="+221 77 000 00 00"
                  placeholderTextColor={colors.neutral[400]}
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  returnKeyType="next"
                  onSubmitEditing={() => dateNaissanceRef.current?.focus()}
                  editable={!saving}
                  maxLength={20}
                />
              </View>

              {/* Date de naissance */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Date de naissance (AAAA-MM-JJ)</Text>
                <TextInput
                  ref={dateNaissanceRef}
                  style={[styles.input, errors.dateNaissance && styles.inputError]}
                  value={dateNaissance}
                  onChangeText={(t) => {
                    setDateNaissance(t);
                    if (errors.dateNaissance) setErrors((e) => ({ ...e, dateNaissance: undefined }));
                  }}
                  keyboardType="numbers-and-punctuation"
                  placeholder="ex: 1995-08-24"
                  placeholderTextColor={colors.neutral[400]}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  editable={!saving}
                  maxLength={10}
                />
                {errors.dateNaissance && <ErrorText text={errors.dateNaissance} />}
              </View>

              {/* Bouton Enregistrer */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                disabled={saving || !hasChanges}
                style={[styles.saveBtn, (saving || !hasChanges) && styles.btnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Enregistrer les modifications"
                accessibilityState={{ disabled: saving || !hasChanges }}
              >
                {saving ? (
                  <ActivityIndicator color={colors.forest[950]} />
                ) : (
                  <>
                    <Check size={16} color={colors.forest[950]} strokeWidth={2.5} />
                    <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <View style={styles.errorRow}>
      <AlertCircle size={12} color={colors.error[600]} />
      <Text style={styles.errorText}>{text}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
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

  // Grille des champs Web (FieldShell)
  fieldsGrid: {
    gap: 10,
  },
  fieldShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    padding: 12,
  },
  fieldShellIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldShellContent: {
    flex: 1,
    gap: 1,
  },
  fieldShellLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldShellValue: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  fieldShellValueEmpty: {
    fontFamily: typography.fontBody,
    color: colors.neutral[400],
    fontStyle: 'italic',
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
    maxHeight: '85%',
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
    alignItems: 'flex-start',
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
  sheetSubline: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  apiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500] + '33',
    borderRadius: radius.inner,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  apiErrorText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.error[700],
  },

  formStack: { gap: 14 },
  fieldBlock: { gap: 5, marginBottom: 14 },
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
  inputError: {
    borderColor: colors.error[500],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.error[700],
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
  btnDisabled: { opacity: 0.5 },
});