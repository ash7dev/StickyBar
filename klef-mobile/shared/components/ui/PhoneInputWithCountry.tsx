import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY,
  CountryCodeOption,
} from '../../constants/country-codes';
import { colors, radius, typography } from '../../theme/tokens';

export interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullE164: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function PhoneInputWithCountry({
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
}: PhoneInputWithCountryProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(DEFAULT_COUNTRY);
  const [localNumber, setLocalNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronisation initiale / externe du numéro E.164
  useEffect(() => {
    if (!value) {
      setLocalNumber('');
      return;
    }

    const val = value.trim();
    const matched = COUNTRY_CODES.find((c) => val.startsWith(c.dialCode));
    if (matched) {
      setSelectedCountry(matched);
      setLocalNumber(val.slice(matched.dialCode.length).trim());
    } else {
      setLocalNumber(val.replace(/\D/g, ''));
    }
  }, [value]);

  const handleSelectCountry = (country: CountryCodeOption) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setSearchQuery('');
    const cleanLocal = localNumber.replace(/\D/g, '');
    const full = cleanLocal ? `${country.dialCode}${cleanLocal}` : country.dialCode;
    onChange(full);
  };

  const handleNumberChange = (raw: string) => {
    // Si l'utilisateur colle un numéro avec + (ex: +33612345678)
    if (raw.trim().startsWith('+')) {
      const matched = COUNTRY_CODES.find((c) => raw.trim().startsWith(c.dialCode));
      if (matched) {
        setSelectedCountry(matched);
        const clean = raw.trim().slice(matched.dialCode.length).replace(/\D/g, '');
        setLocalNumber(clean);
        onChange(`${matched.dialCode}${clean}`);
        return;
      }
    }

    const clean = raw.replace(/\D/g, '');
    setLocalNumber(clean);
    onChange(clean ? `${selectedCountry.dialCode}${clean}` : '');
  };

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        {/* Sélecteur d'indicatif avec Modal */}
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={disabled}
          onPress={() => setModalVisible(true)}
          style={styles.countryPickerButton}
        >
          <Text style={styles.flagText}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCodeText}>{selectedCountry.dialCode}</Text>
          <ChevronDown size={14} color={colors.neutral[600]} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Champ de Saisie du Numéro Local */}
        <TextInput
          editable={!disabled}
          keyboardType="phone-pad"
          onChangeText={handleNumberChange}
          placeholder={placeholder || selectedCountry.placeholder}
          placeholderTextColor={colors.neutral[400]}
          style={styles.textInput}
          value={localNumber}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Modal Sélecteur de Pays Native */}
      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionnez un pays</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <X size={20} color={colors.neutral[900]} />
            </TouchableOpacity>
          </View>

          {/* Recherche */}
          <View style={styles.searchBar}>
            <Search size={18} color={colors.neutral[500]} />
            <TextInput
              autoCapitalize="none"
              onChangeText={setSearchQuery}
              placeholder="Rechercher un pays ou indicatif..."
              placeholderTextColor={colors.neutral[400]}
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>

          {/* Liste des indicatifs */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => `${item.code}-${item.dialCode}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSelectCountry(item)}
                style={[
                  styles.countryItem,
                  item.code === selectedCountry.code && styles.countryItemSelected,
                ]}
              >
                <Text style={styles.countryItemFlag}>{item.flag}</Text>
                <Text style={styles.countryItemName}>{item.name}</Text>
                <Text style={styles.countryItemDial}>{item.dialCode}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.field,
    paddingHorizontal: 12,
  },
  inputRowError: {
    borderColor: colors.error[500],
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 6,
  },
  flagText: {
    fontSize: 18,
  },
  dialCodeText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.neutral[200],
    marginHorizontal: 8,
  },
  textInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral[900],
    paddingVertical: 8,
  },
  errorText: {
    marginTop: 4,
    fontSize: typography.sizes.xs,
    color: colors.error[500],
    fontWeight: '500',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  closeButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.pill,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.neutral[900],
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: 12,
  },
  countryItemSelected: {
    backgroundColor: colors.forest[50],
  },
  countryItemFlag: {
    fontSize: 22,
  },
  countryItemName: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  countryItemDial: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.forest[600],
  },
});
