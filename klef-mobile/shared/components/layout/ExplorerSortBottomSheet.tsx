import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Check, X, ArrowUpDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';

export type SortOptionValue = 'pertinence' | 'prix_asc' | 'prix_desc' | 'note_desc' | 'recent';

export interface SortOption {
  value: SortOptionValue;
  label: string;
  sublabel: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'pertinence', label: 'Pertinence', sublabel: 'Recommandation intelligente Klef' },
  { value: 'prix_asc', label: 'Prix croissant', sublabel: 'Du moins cher au plus cher' },
  { value: 'prix_desc', label: 'Prix décroissant', sublabel: 'Du plus cher au moins cher' },
  { value: 'note_desc', label: 'Les mieux notés', sublabel: 'Meilleures évaluations voyageurs' },
  { value: 'recent', label: 'Plus récents', sublabel: 'Dernières annonces ajoutées' },
];

interface ExplorerSortBottomSheetProps {
  visible: boolean;
  currentSort: SortOptionValue;
  onSelectSort: (sort: SortOptionValue) => void;
  onClose: () => void;
}

export function ExplorerSortBottomSheet({
  visible,
  currentSort,
  onSelectSort,
  onClose,
}: ExplorerSortBottomSheetProps) {
  const handleSelect = (value: SortOptionValue) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectSort(value);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.dragHandle} />

              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <ArrowUpDown size={18} color={colors.forest[900]} />
                  <Text style={styles.title}>Trier les logements</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
                  <X size={18} color={colors.neutral[600]} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = currentSort === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.75}
                      onPress={() => handleSelect(opt.value)}
                      style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    >
                      <View style={styles.optionTextCol}>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Check size={14} color={colors.forest[950]} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: typography.fontDisplay,
    fontSize: 17,
    color: colors.forest[900],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  optionItemSelected: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[300],
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.neutral[800],
  },
  optionLabelSelected: {
    color: colors.forest[900],
  },
  optionSublabel: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
