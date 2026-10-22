import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../shared/theme/tokens';
import OwnerProfileScreen from '../(owner)/profile';

/** Même profil que l'espace hôte (identité, KYC, sécurité, changement d'espace). */
export default function ManagerProfileScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <OwnerProfileScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
});
