export interface CountryCodeOption {
  code: string; // ISO 2
  name: string;
  dialCode: string; // ex: "+221"
  flag: string; // Emoji drapeau
  placeholder: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  // 🟢 Afrique de l'Ouest / Sénégal (Prioritaire)
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳', placeholder: '77 123 45 67' },
  { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮', placeholder: '07 01 23 45 67' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱', placeholder: '66 12 34 56' },
  { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳', placeholder: '62 12 34 56' },
  { code: 'GM', name: 'Gambie', dialCode: '+220', flag: '🇬🇲', placeholder: '70 12 345' },
  { code: 'MR', name: 'Mauritanie', dialCode: '+222', flag: '🇲🇷', placeholder: '45 12 34 56' },
  { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯', placeholder: '97 12 34 56' },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬', placeholder: '90 12 34 56' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫', placeholder: '70 12 34 56' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪', placeholder: '90 12 34 56' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲', placeholder: '6 70 12 34 56' },

  // 🔵 Diaspora Européenne
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭', placeholder: '79 123 45 67' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪', placeholder: '151 12345678' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧', placeholder: '7123 456789' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸', placeholder: '612 34 56 78' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹', placeholder: '312 345 6789' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪', placeholder: '470 12 34 56' },

  // 🟡 Amérique du Nord
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸', placeholder: '(555) 000-0000' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', placeholder: '(555) 000-0000' },

  // 🟠 Maghreb & Moyen-Orient
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦', placeholder: '6 12 34 56 78' },
  { code: 'AE', name: 'Émirats Arabes Unis', dialCode: '+971', flag: '🇦🇪', placeholder: '50 123 4567' },
  { code: 'SA', name: 'Arabie Saoudite', dialCode: '+966', flag: '🇸🇦', placeholder: '50 123 4567' },

  // 🟣 Afrique Centrale
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦', placeholder: '66 12 34 56' },
  { code: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬', placeholder: '06 123 4567' },
  { code: 'CD', name: 'RDC', dialCode: '+243', flag: '🇨🇩', placeholder: '81 234 5678' },
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // Sénégal (+221)
