import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, X } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import { AppButton } from '../../../shared/components/ui/AppButton';

export interface AuthGuardModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function AuthGuardModal({
  visible,
  onClose,
  title = 'Connexion requise',
  message = 'Connectez-vous en 30 secondes pour réserver, ajouter des favoris ou accéder à votre espace hôte.',
}: AuthGuardModalProps) {
  const router = useRouter();

  const handleLoginPress = () => {
    onClose();
    router.push('/(auth)/login' as any);

  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={18} color={colors.neutral[600]} />
          </TouchableOpacity>

          {/* Marker Box Icon */}
          <View style={styles.iconBox}>
            <ShieldCheck size={28} color={colors.marker.icon} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <AppButton
              label="Se connecter / S'inscrire"
              onPress={handleLoginPress}
              size="md"
              variant="action"
            />
            <AppButton
              label="Continuer en mode invité"
              onPress={onClose}
              size="md"
              variant="outline"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.inner,
    backgroundColor: colors.marker.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
});
