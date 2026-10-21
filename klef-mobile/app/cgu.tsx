import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Users,
  Home,
  Star,
  Banknote,
  CreditCard,
  XCircle,
  CheckCircle2,
  Scale,
  Shield,
  Lock,
  Building2,
  Mail,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../shared/theme/tokens';
import { AnimatedScreenWrapper } from '../shared/components/animation/AnimatedScreenWrapper';

const SECTIONS = [
  { id: 'objet', number: '1', title: "Objet et champ d'application", icon: FileText },
  { id: 'definitions', number: '2', title: 'Définitions', icon: BookOpen },
  { id: 'inscription', number: '3', title: "Inscription & KYC", icon: Users },
  { id: 'annonces', number: '4', title: 'Annonces & propriétaires', icon: Home },
  { id: 'reservations', number: '5', title: 'Réservations & locataires', icon: Star },
  { id: 'paiements', number: '6', title: 'Paiements & séquestre', icon: Banknote },
  { id: 'commission', number: '7', title: 'Commission & frais', icon: CreditCard },
  { id: 'annulations', number: '8', title: 'Annulations & pénalités', icon: XCircle },
  { id: 'etat-des-lieux', number: '9', title: 'État des lieux', icon: CheckCircle2 },
  { id: 'litiges', number: '10', title: 'Litiges & médiation', icon: Scale },
  { id: 'responsabilites', number: '11', title: 'Responsabilités', icon: Shield },
  { id: 'donnees', number: '12', title: 'Données personnelles', icon: Lock },
  { id: 'droit', number: '13', title: 'Droit applicable', icon: Building2 },
] as const;

export default function CGUScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>('objet');

  const handleSelectSection = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveSection(id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AnimatedScreenWrapper preset="slideUp" distance={18}>
        {/* ── En-tête ───────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.navigate('/(tenant)' as any);
            }}
            style={styles.backBtn}
          >
            <ArrowLeft size={18} color={colors.forest[950]} />
          </TouchableOpacity>

          <View style={styles.headerTitleStack}>
            <Text style={styles.headerEyebrow}>DOCUMENT LÉGAL</Text>
            <Text style={styles.headerTitle}>Conditions Générales</Text>
          </View>
        </View>

        {/* ── Métadonnées Version ──────────────────────────────────────────── */}
        <View style={styles.metaStrip}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>APPLICATION</Text>
            <Text style={styles.metaValue}>Sénégal</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>VERSION</Text>
            <Text style={styles.metaValue}>2.1 (Janv. 2025)</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>COMMISSION</Text>
            <Text style={styles.metaValue}>0% Hôte / 7% Voy.</Text>
          </View>
        </View>

        {/* ── Rail horizontal de sommaire ───────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.tocRail}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            const IconComp = s.icon;
            return (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.8}
                onPress={() => handleSelectSection(s.id)}
                style={[styles.tocChip, isActive && styles.tocChipActive]}
              >
                <IconComp
                  size={13}
                  color={isActive ? colors.forest[950] : colors.neutral[600]}
                />
                <Text
                  style={[styles.tocChipText, isActive && styles.tocChipTextActive]}
                >
                  Art. {s.number} — {s.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Contenu des Articles ─────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Article 1 */}
          <View style={styles.articleCard}>
            <View style={styles.articleHeader}>
              <View style={styles.articleIconBox}>
                <FileText size={18} color={colors.forest[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNumber}>ARTICLE 1</Text>
                <Text style={styles.articleTitle}>Objet et champ d'application</Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme <Text style={styles.bold}>Paixi</Text>, éditée par la société Paixi SAS, immatriculée au Registre du Commerce et du Crédit Mobilier de Dakar.
            </Text>
            <Text style={styles.paragraph}>
              Paixi est une marketplace de mise en relation entre des propriétaires de logements pour des séjours de courte et moyenne durée au Sénégal.
            </Text>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>
                🔑 <Text style={styles.bold}>Paixi agit en qualité d'intermédiaire tiers de confiance</Text> et n'est pas partie au contrat de location. La Plateforme sécurise les paiements et assure la médiation.
              </Text>
            </View>
          </View>

          {/* Article 2 */}
          <View style={styles.articleCard}>
            <View style={styles.articleHeader}>
              <View style={styles.articleIconBox}>
                <BookOpen size={18} color={colors.forest[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNumber}>ARTICLE 2</Text>
                <Text style={styles.articleTitle}>Définitions essentielles</Text>
              </View>
            </View>

            {[
              { term: 'Plateforme', desc: 'Le site web et l\'application mobile Paixi.' },
              { term: 'Séquestre (SEQ)', desc: 'Mécanisme retenant le montant jusqu\'au check-in.' },
              { term: 'KYC', desc: 'Procédure de vérification d\'identité obligatoire (CNI/Passeport).' },
              { term: 'FCFA', desc: 'Franc CFA (XOF), monnaie officielle de transaction.' },
            ].map((def) => (
              <View key={def.term} style={styles.defRow}>
                <Text style={styles.defTerm}>{def.term} :</Text>
                <Text style={styles.defDesc}>{def.desc}</Text>
              </View>
            ))}
          </View>

          {/* Article 3 */}
          <View style={styles.articleCard}>
            <View style={styles.articleHeader}>
              <View style={styles.articleIconBox}>
                <Users size={18} color={colors.forest[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNumber}>ARTICLE 3</Text>
                <Text style={styles.articleTitle}>Inscription & Vérification KYC</Text>
              </View>
            </View>
            <Text style={styles.paragraph}>
              L'inscription est ouverte à toute personne majeure (18 ans ou plus). Avant toute publication ou réservation sensible, une pièce d'identité valide (CNI sénégalaise ou Passeport) doit être soumise.
            </Text>
          </View>

          {/* Article 6 & 7 - Paiements et Commission */}
          <View style={styles.articleCard}>
            <View style={styles.articleHeader}>
              <View style={styles.articleIconBox}>
                <Banknote size={18} color={colors.forest[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNumber}>ARTICLES 6 & 7</Text>
                <Text style={styles.articleTitle}>Paiements, Séquestre & Commission</Text>
              </View>
            </View>

            <View style={styles.ratesGrid}>
              <View style={styles.rateBox}>
                <Text style={styles.rateValue}>0 %</Text>
                <Text style={styles.rateLabel}>Hôte / Propriétaire</Text>
                <Text style={styles.rateSub}>Zéro commission prélevée sur le net hôte</Text>
              </View>

              <View style={styles.rateBox}>
                <Text style={styles.rateValue}>7 %</Text>
                <Text style={styles.rateLabel}>Voyageur / Locataire</Text>
                <Text style={styles.rateSub}>Frais de service et séquestre sécurisé</Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              Moyens de paiement acceptés : Wave & Orange Money. Les fonds sont conservés sous le numéro de référence séquestre <Text style={styles.bold}>SEQ-XXXXXXXX</Text> jusqu'au check-in.
            </Text>
          </View>

          {/* Article 8 - Annulations */}
          <View style={styles.articleCard}>
            <View style={styles.articleHeader}>
              <View style={styles.articleIconBox}>
                <XCircle size={18} color={colors.error[600]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNumber}>ARTICLE 8</Text>
                <Text style={styles.articleTitle}>Politique d'annulation</Text>
              </View>
            </View>

            <Text style={styles.subHeading}>Barème Voyageur :</Text>
            <Text style={styles.bulletItem}>• Plus de 3 jours avant le séjour : Remboursement 100% (frais de service retenus)</Text>
            <Text style={styles.bulletItem}>• Entre 24h et 3 jours : Remboursement partiel 75%</Text>
            <Text style={styles.bulletItem}>• Moins de 24h : Remboursement partiel 50%</Text>
          </View>

          {/* Contact Legal */}
          <View style={styles.legalContactCard}>
            <Mail size={20} color={colors.lime[400]} />
            <Text style={styles.legalContactTitle}>Une question juridique ?</Text>
            <Text style={styles.legalContactSub}>
              Contactez notre département légal à legal@klef.sn
            </Text>
          </View>
        </ScrollView>
      </AnimatedScreenWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleStack: {
    flex: 1,
  },
  headerEyebrow: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },

  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.forest[950],
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  metaItem: {
    gap: 1,
  },
  metaLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9,
    color: colors.forest[300],
    letterSpacing: 0.6,
  },
  metaValue: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[0],
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  tocRail: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tocChipActive: {
    backgroundColor: colors.lime[400],
    borderColor: colors.action.edge,
  },
  tocChipText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.neutral[600],
  },
  tocChipTextActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },

  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  articleCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  articleIconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleNumber: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[600],
    letterSpacing: 0.8,
  },
  articleTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },

  paragraph: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  bold: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
  highlightBox: {
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[200],
    borderRadius: radius.inner,
    padding: 10,
    marginTop: 4,
  },
  highlightText: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.forest[900],
    lineHeight: 16,
  },

  defRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  defTerm: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[700],
    minWidth: 90,
  },
  defDesc: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    flex: 1,
  },

  ratesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  rateBox: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    gap: 2,
  },
  rateValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 22,
    color: colors.forest[700],
  },
  rateLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },
  rateSub: {
    fontFamily: typography.fontBody,
    fontSize: 9.5,
    color: colors.neutral[500],
    textAlign: 'center',
  },

  subHeading: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
    marginTop: 4,
  },
  bulletItem: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[700],
    lineHeight: 17,
  },

  legalContactCard: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  legalContactTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.neutral[0],
  },
  legalContactSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[300],
  },
});
