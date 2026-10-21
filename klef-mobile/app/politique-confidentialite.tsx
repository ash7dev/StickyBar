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
  Lock,
  Database,
  Eye,
  FileText,
  Clock,
  Globe,
  Server,
  UserCheck,
  Cookie,
  Shield,
  AlertTriangle,
  Bell,
  Mail,
  Building2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../shared/theme/tokens';
import { AnimatedScreenWrapper } from '../shared/components/animation/AnimatedScreenWrapper';

const SECTIONS = [
  { id: 'responsable', number: '1', title: 'Responsable du traitement', icon: Building2 },
  { id: 'collecte', number: '2', title: 'Données collectées', icon: Database },
  { id: 'finalites', number: '3', title: 'Finalités', icon: Eye },
  { id: 'base-legale', number: '4', title: 'Base légale', icon: FileText },
  { id: 'conservation', number: '5', title: 'Durée de conservation', icon: Clock },
  { id: 'destinataires', number: '6', title: 'Destinataires', icon: Globe },
  { id: 'transferts', number: '7', title: 'Transferts internationaux', icon: Server },
  { id: 'droits', number: '8', title: 'Vos droits', icon: UserCheck },
  { id: 'cookies', number: '9', title: 'Cookies & traceurs', icon: Cookie },
  { id: 'securite', number: '10', title: 'Sécurité', icon: Shield },
  { id: 'mineurs', number: '11', title: 'Mineurs', icon: AlertTriangle },
  { id: 'modifications', number: '12', title: 'Modifications', icon: Bell },
  { id: 'contact', number: '13', title: 'Nous contacter / DPO', icon: Mail },
] as const;

export default function PolitiqueConfidentialiteScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>('responsable');

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
            <Text style={styles.headerEyebrow}>PROTECTION DES DONNÉES</Text>
            <Text style={styles.headerTitle}>Politique de Confidentialité</Text>
          </View>
        </View>

        {/* ── Métadonnées Version ──────────────────────────────────────────── */}
        <View style={styles.metaStrip}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>CADRE JURIDIQUE</Text>
            <Text style={styles.metaValue}>Loi 2008-12 · RGPD</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>VERSION</Text>
            <Text style={styles.metaValue}>1.4 (Janv. 2025)</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>DPO</Text>
            <Text style={styles.metaValue}>dpo@klef.sn</Text>
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
                <Building2 size={18} color={colors.forest[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNumber}>ARTICLE 1</Text>
                <Text style={styles.articleTitle}>Responsable du traitement</Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              Le responsable du traitement de vos données personnelles est la société <Text style={styles.bold}>Paixi SAS</Text>, située à Dakar, Sénégal.
            </Text>
            <Text style={styles.paragraph}>
              Conformément à la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la Protection des Données à caractère personnel et au RGPD, Paixi garantit un traitement loyal et sécurisé.
            </Text>
          </View>

          {/* Article 2 */}
          <View style={styles.articleCard}>
            <View style={styles.articleHeader}>
              <View style={styles.articleIconBox}>
                <Database size={18} color={colors.forest[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNumber}>ARTICLE 2</Text>
                <Text style={styles.articleTitle}>Données collectées</Text>
              </View>
            </View>

            <Text style={styles.bulletItem}>• Identité & KYC : Nom, prénom, CNI / Passeport, selfie.</Text>
            <Text style={styles.bulletItem}>• Contact : Numéro de téléphone (OTP SMS), adresse e-mail.</Text>
            <Text style={styles.bulletItem}>• Transactions : Historique des réservations, numéros Wave/OM masqués.</Text>
            <Text style={styles.bulletItem}>• Médias : Photos des biens, photos horodatées d'état des lieux.</Text>
          </View>

          {/* Article 5 - Durées de conservation */}
          <View style={styles.articleCard}>
            <View style={styles.articleHeader}>
              <View style={styles.articleIconBox}>
                <Clock size={18} color={colors.forest[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNumber}>ARTICLE 5</Text>
                <Text style={styles.articleTitle}>Durée de conservation</Text>
              </View>
            </View>

            {[
              { cat: 'Compte actif', time: 'Durée de vie du compte' },
              { cat: 'Compte supprimé', time: '3 ans (prévention des fraudes)' },
              { cat: 'Transactions financières', time: '10 ans (Code des impôts)' },
              { cat: 'Documents KYC', time: '5 ans (Obligations LCB-FT)' },
              { cat: 'Photos d\'état des lieux', time: '6 mois après le séjour' },
            ].map((row) => (
              <View key={row.cat} style={styles.retentionRow}>
                <Text style={styles.retentionCat}>{row.cat}</Text>
                <Text style={styles.retentionTime}>{row.time}</Text>
              </View>
            ))}
          </View>

          {/* Article 8 - Vos Droits & Suppression */}
          <View style={styles.articleCard}>
            <View style={styles.articleHeader}>
              <View style={styles.articleIconBox}>
                <UserCheck size={18} color={colors.forest[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNumber}>ARTICLE 8</Text>
                <Text style={styles.articleTitle}>Vos droits & Suppression de compte</Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              Vous disposez d'un droit d'accès, de rectification, de portabilité et d'<Text style={styles.bold}>effacement définitif (droit à l'oubli)</Text> de vos données personnelles.
            </Text>
            <Text style={styles.paragraph}>
              Vous pouvez demander la suppression de votre compte directement depuis votre profil ou en écrivant à <Text style={styles.bold}>privacy@klef.sn</Text>. Notre DPO répond sous 30 jours.
            </Text>
          </View>

          {/* Contact DPO */}
          <View style={styles.dpoCard}>
            <Lock size={20} color={colors.lime[400]} />
            <Text style={styles.dpoTitle}>Délégué à la Protection des Données (DPO)</Text>
            <Text style={styles.dpoSub}>dpo@klef.sn · Dakar, République du Sénégal</Text>
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
    fontSize: 16,
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
  bulletItem: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[700],
    lineHeight: 17,
  },

  retentionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: 8,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  retentionCat: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[950],
  },
  retentionTime: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.forest[700],
  },

  dpoCard: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  dpoTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.neutral[0],
  },
  dpoSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[300],
  },
});
