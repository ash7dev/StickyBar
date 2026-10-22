import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, typography } from '../../../../shared/theme/tokens';
import { BottomSheet } from '../../../calendar/components/BottomSheet';
import { INK, LIME, LINE, MUTED } from './ui';

export interface OwnerOption {
  id: string;
  name: string;
  listings: number;
}

/** Filtre propriétaire : tout l'écran se limite aux biens d'un propriétaire. */
export function OwnerFilterSheet({
  visible,
  owners,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  owners: OwnerOption[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const total = owners.reduce((s, o) => s + o.listings, 0);
  const options: Array<OwnerOption & { all?: boolean }> = [{ id: '', name: 'Tous les propriétaires', listings: total, all: true }, ...owners];
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Afficher" subtitle="Limitez la journée et les chiffres à un propriétaire.">
      <View style={styles.list}>
        {options.map((o) => {
          const active = o.all ? selected === null : selected === o.id;
          return (
            <TouchableOpacity
              key={o.id || 'all'}
              onPress={() => {
                onSelect(o.all ? null : o.id);
                onClose();
              }}
              style={[styles.row, active && styles.rowOn]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <View style={[styles.avatar, active && { backgroundColor: LIME }]}>
                <Text style={styles.avatarText}>{o.all ? '★' : o.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.name}>{o.name}</Text>
                <Text style={styles.meta}>
                  {o.listings} bien{o.listings > 1 ? 's' : ''}
                </Text>
              </View>
              {active && <Check size={18} color={INK} strokeWidth={2.6} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF' },
  rowOn: { borderColor: INK, borderWidth: 1.5 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.forest[100], alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  name: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  meta: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED, marginTop: 1 },
});
