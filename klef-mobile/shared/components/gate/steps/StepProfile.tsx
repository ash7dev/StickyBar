import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { UserCheck, Calendar, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../theme/tokens';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../../features/auth/stores/auth.store';

interface StepProfileProps {
  onDone: () => void;
}

export function StepProfile({ onDone }: StepProfileProps) {
  const { user, setUser } = useAuthStore();

  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [nom, setNom] = useState(user?.nom || '');
  const [dateNaissance, setDateNaissance] = useState(
    user?.dateNaissance
      ? user.dateNaissance.split('T')[0]
      : ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    prenom.trim().length >= 2 &&
    nom.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateNaissance.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.patch<any>('/users/profile', {
        prenom: prenom.trim(),
        nom: nom.trim(),
        dateNaissance: dateNaissance.trim(),
      });

      const updatedUser = {
        ...user,
        ...response.data,
        prenom: prenom.trim(),
        nom: nom.trim(),
        dateNaissance: dateNaissance.trim(),
        profileCompleted: true,
      };

      setUser(updatedUser);
      setLoading(false);
      onDone();
    } catch (err: any) {
      console.error('[StepProfile] Erreur mise à jour profil:', err);
      const msg =
        err.response?.data?.message ||
        'Impossible de mettre à jour le profil. Vérifiez les informations.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Champ Prénom */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>PRÉNOM</Text>
        <TextInput
          value={prenom}
          onChangeText={setPrenom}
          placeholder="Ex: Aminata"
          placeholderTextColor={colors.neutral[400]}
          style={styles.textInput}
          autoCapitalize="words"
        />
      </View>

      {/* Champ Nom */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>NOM</Text>
        <TextInput
          value={nom}
          onChangeText={setNom}
          placeholder="Ex: Diallo"
          placeholderTextColor={colors.neutral[400]}
          style={styles.textInput}
          autoCapitalize="characters"
        />
      </View>

      {/* Champ Date de Naissance */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>DATE DE NAISSANCE (AAAA-MM-JJ)</Text>
        <View style={styles.inputWithIconRow}>
          <Calendar size={18} color={colors.forest[600]} style={styles.inputIcon} />
          <TextInput
            value={dateNaissance}
            onChangeText={setDateNaissance}
            placeholder="Ex: 1995-08-14"
            placeholderTextColor={colors.neutral[400]}
            style={[styles.textInput, styles.inputFlex]}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>
        <Text style={styles.fieldHelpText}>
          Format : Année-Mois-Jour (ex: 1995-08-14). Requis pour valider l'âge minimum.
        </Text>
      </View>

      {/* Erreur */}
      {error ? (
        <View style={styles.errorBox}>
          <AlertCircle size={15} color={colors.error[600]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Bouton de Validation */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleSubmit}
        disabled={!isValid || loading}
        style={[
          styles.submitButton,
          (!isValid || loading) && styles.submitButtonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.forest[950]} size="small" />
        ) : (
          <>
            <Text
              style={[
                styles.submitButtonText,
                (!isValid || loading) && styles.submitButtonTextDisabled,
              ]}
            >
              Enregistrer mon profil
            </Text>
            <ArrowRight
              size={16}
              color={isValid && !loading ? colors.forest[950] : colors.neutral[500]}
            />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingTop: 4,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[600],
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 2,
  },
  inputFlex: {
    flex: 1,
    paddingLeft: 42,
  },
  fieldHelpText: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    padding: 10,
    borderRadius: radius.inner,
  },
  errorText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.error[700],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 14,
    borderRadius: radius.pill,
    marginTop: 6,
    ...shadows.xs,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[200],
  },
  submitButtonText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  submitButtonTextDisabled: {
    color: colors.neutral[500],
  },
});
