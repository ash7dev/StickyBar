import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  MessageSquare,
  PhoneCall,
  Sparkles,
  HelpCircle,
  Ticket,
  PlusCircle,
  Search,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  UserCheck,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../shared/theme/tokens';
import { useAuthStore } from '../features/auth/stores/auth.store';
import { AuthRequiredCard } from '../features/auth/components/AuthRequiredCard';
import { supportApi, TicketSupport, CategorieTicket, PrioriteTicket } from '../shared/api/support.api';
import { AnimatedScreenWrapper } from '../shared/components/animation/AnimatedScreenWrapper';

// Knowledge Base de l'Assistant Paixi
interface FAQItem {
  id: string;
  category: 'VOYAGEUR' | 'HOTE' | 'PAIEMENT' | 'KYC';
  question: string;
  answer: string;
  actionUrl?: string;
  actionLabel?: string;
  tags: string[];
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'PAIEMENT',
    question: 'Quels sont les moyens de paiement acceptés au Sénégal ?',
    answer: "Nous acceptons exclusivement Wave et Orange Money. Tous les paiements sont 100% sécurisés. Les fonds restent sous séquestre jusqu'à votre entrée effective dans le logement.",
    tags: ['wave', 'orange money', 'paiement', 'payer', 'sequestre', 'sécurité', 'mobile money'],
  },
  {
    id: 'faq-2',
    category: 'HOTE',
    question: 'Quelle est la commission prélevée sur les hôtes (propriétaires) ?',
    answer: 'Paixi applique 0% de commission sur les hôtes ! Vous percevez 100% du prix de nuitée que vous avez fixé. Seule une commission transparente de 7% est ajoutée côté voyageur.',
    tags: ['commission', 'hôte', 'frais', 'tarif', 'gratuit', 'propriétaire', 'pourcentage', '0%'],
  },
  {
    id: 'faq-3',
    category: 'PAIEMENT',
    question: 'Comment fonctionnent les retraits de revenus pour les hôtes ?',
    answer: 'Vos gains débloqués après chaque séjour sont disponibles sur votre portefeuille Paixi. Vous pouvez demander un virement directement vers votre compte Wave ou Orange Money (traitement sous 24h à 48h).',
    tags: ['retrait', 'virement', 'solde', 'portefeuille', 'récupérer argent', 'wave', 'om'],
  },
  {
    id: 'faq-4',
    category: 'VOYAGEUR',
    question: "Quelles sont les règles et barèmes d'annulation ?",
    answer: "• Plus de 3 jours avant le check-in : Remboursement à 100% (hors commission Paixi de 7%)\n• Entre 24h et 3 jours : Remboursement à 75%\n• Moins de 24h : Remboursement à 50%.",
    tags: ['annulation', 'remboursement', 'annuler', 'politique', 'barème', 'délai'],
  },
  {
    id: 'faq-5',
    category: 'KYC',
    question: 'Comment vérifier mon identité (KYC) ?',
    answer: 'Allez dans votre profil, téléchargez votre CNI sénégalaise ou votre Passeport (recto/verso) et prenez un selfie rapide. La validation automatique prend moins de 15 minutes.',
    tags: ['kyc', 'cni', 'carte identité', 'passeport', 'vérification', 'selfie', 'compte vérifié'],
  },
  {
    id: 'faq-6',
    category: 'VOYAGEUR',
    question: "Comment fonctionne la caution et l'état des lieux photo ?",
    answer: "Lors de votre arrivée (Check-in) et de votre départ (Check-out), vous téléchargez des photos de l'état du logement directement depuis l'application. En cas de dégât avéré, Paixi gère la médiation.",
    tags: ['caution', 'état des lieux', 'dégâts', 'check-in', 'check-out', 'photos', 'photos état des lieux'],
  },
  {
    id: 'faq-7',
    category: 'VOYAGEUR',
    question: 'Où télécharger mon contrat de location PDF ?',
    answer: 'Chaque réservation confirmée génère automatiquement un contrat de location horodaté et signé numériquement. Vous pouvez le consulter et le télécharger sur la page de détails de votre séjour.',
    tags: ['contrat', 'pdf', 'bail', 'signature', 'document', 'télécharger'],
  },
];

const SUPPORT_PHONE = '+221 33 800 00 00';
const WHATSAPP_NUMBER = '221770000000';

type TabType = 'faq' | 'tickets' | 'new';

export default function AssistanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; reservationId?: string; logementId?: string }>();
  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>((params.tab as TabType) || 'faq');

  // FAQ State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Form State
  const [ticketSujet, setTicketSujet] = useState('');
  const [ticketCategorie, setTicketCategorie] = useState<CategorieTicket>('RESERVATION');
  const [ticketPriorite, setTicketPriorite] = useState<PrioriteTicket>('MOYENNE');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketCode, setCreatedTicketCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // React Query - Load Tickets
  const {
    data: tickets = [],
    isLoading: isLoadingTickets,
    isRefetching: isRefetchingTickets,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: () => supportApi.getMyTickets(),
    enabled: isAuthenticated && activeTab === 'tickets',
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (params.tab && ['faq', 'tickets', 'new'].includes(params.tab as string)) {
      setActiveTab(params.tab as TabType);
    }
  }, [params.tab]);

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveTab(tab);
  };

  const handleCallSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Paixi Assistance', `Appelez le ${SUPPORT_PHONE}`);
    });
  };

  const handleOpenWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const text = encodeURIComponent(
      "Bonjour l'équipe Paixi Assistance,\nJ'ai une demande concernant ma réservation / mon compte."
    );
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`).catch(() => {
      Alert.alert('WhatsApp', 'Impossible d’ouvrir WhatsApp sur votre appareil.');
    });
  };

  // Submit new ticket
  const handleCreateTicket = async () => {
    if (!ticketSujet.trim() || !ticketMessage.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setFormError('Veuillez remplir le sujet et le message de votre demande.');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour créer un ticket.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const newTicket = await supportApi.createTicket({
        sujet: ticketSujet.trim(),
        message: ticketMessage.trim(),
        categorie: ticketCategorie,
        priorite: ticketPriorite,
        reservationId: params.reservationId,
        logementId: params.logementId,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCreatedTicketCode(newTicket.code);
      setTicketSujet('');
      setTicketMessage('');
      refetchTickets();
    } catch (err: any) {
      console.error('[AssistanceScreen] Create ticket error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setFormError(
        err?.response?.data?.message ||
          'Une erreur est survenue lors de la création de votre ticket.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter FAQ items
  const filteredFAQ = FAQ_DATA.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q))
    );
  });

  const renderBadgeStatut = (statut: string) => {
    switch (statut) {
      case 'OUVERT':
        return { label: 'Ouvert', bg: '#FEF3C7', color: '#D97706' };
      case 'EN_COURS':
        return { label: 'En cours', bg: '#DBEAFE', color: '#2563EB' };
      case 'EN_ATTENTE_UTILISATEUR':
        return { label: 'Réponse reçue', bg: '#DCFCE7', color: '#16A34A' };
      case 'RESOLU':
        return { label: 'Résolu', bg: '#F3F4F6', color: '#4B5563' };
      default:
        return { label: statut, bg: colors.neutral[100], color: colors.neutral[700] };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AnimatedScreenWrapper preset="slideUp" distance={16}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Retour"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={colors.forest[950]} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>Paixi Assistance</Text>
              <View style={styles.pulseBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.pulseBadgeText}>24/7 EN LIGNE</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Support voyageur & conciergerie 7j/7</Text>
          </View>

          <TouchableOpacity
            accessibilityLabel="WhatsApp Support"
            accessibilityRole="button"
            onPress={handleOpenWhatsApp}
            style={styles.wspBtn}
          >
            <MessageSquare size={16} color="#166534" />
          </TouchableOpacity>
        </View>

        {/* ── SEGMENTED CONTROL (ONGLETS) ─────────────────────────────────── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabChange('faq')}
            style={[styles.tabBtn, activeTab === 'faq' && styles.tabBtnActive]}
          >
            <HelpCircle
              size={15}
              color={activeTab === 'faq' ? colors.forest[950] : colors.neutral[500]}
            />
            <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>
              Guide & FAQ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabChange('tickets')}
            style={[styles.tabBtn, activeTab === 'tickets' && styles.tabBtnActive]}
          >
            <Ticket
              size={15}
              color={activeTab === 'tickets' ? colors.forest[950] : colors.neutral[500]}
            />
            <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>
              Mes Tickets {tickets.length > 0 ? `(${tickets.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setCreatedTicketCode(null);
              handleTabChange('new');
            }}
            style={[styles.tabBtn, activeTab === 'new' && styles.tabBtnActive]}
          >
            <PlusCircle
              size={15}
              color={activeTab === 'new' ? colors.forest[950] : colors.neutral[500]}
            />
            <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
              Nouveau
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── CONTENU DE L'ONGLET SÉLECTIONNÉ ─────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            activeTab === 'tickets' && isAuthenticated ? (
              <RefreshControl
                refreshing={isRefetchingTickets}
                onRefresh={refetchTickets}
                tintColor={colors.forest[800]}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          {/* ─────────────────────────────────────────────────────────────
              ONGLET 1 : GUIDE & FAQ
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'faq' && (
            <View style={styles.tabContentStack}>
              {/* Recherche */}
              <View style={styles.searchBox}>
                <Search size={16} color={colors.neutral[400]} style={{ marginRight: 8 }} />
                <TextInput
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher (Wave, caution, 0% fee, CNI)..."
                  placeholderTextColor={colors.neutral[400]}
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </View>

              {/* Chips catégories */}
              <ScrollView
                contentContainerStyle={styles.chipsRow}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCategory('ALL')}
                  style={[
                    styles.chip,
                    selectedCategory === 'ALL' && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === 'ALL' && styles.chipTextActive,
                    ]}
                  >
                    Tous
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory('PAIEMENT')}
                  style={[
                    styles.chip,
                    selectedCategory === 'PAIEMENT' && styles.chipActive,
                  ]}
                >
                  <CreditCard size={12} color={selectedCategory === 'PAIEMENT' ? colors.lime[400] : colors.neutral[600]} />
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === 'PAIEMENT' && styles.chipTextActive,
                    ]}
                  >
                    Wave / OM
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory('HOTE')}
                  style={[
                    styles.chip,
                    selectedCategory === 'HOTE' && styles.chipActive,
                  ]}
                >
                  <Building size={12} color={selectedCategory === 'HOTE' ? colors.lime[400] : colors.neutral[600]} />
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === 'HOTE' && styles.chipTextActive,
                    ]}
                  >
                    Hôte (0% fee)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory('KYC')}
                  style={[
                    styles.chip,
                    selectedCategory === 'KYC' && styles.chipActive,
                  ]}
                >
                  <UserCheck size={12} color={selectedCategory === 'KYC' ? colors.lime[400] : colors.neutral[600]} />
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === 'KYC' && styles.chipTextActive,
                    ]}
                  >
                    KYC / CNI
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Liste des questions FAQ */}
              <View style={styles.faqList}>
                {filteredFAQ.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <View key={faq.id} style={styles.faqCard}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setExpandedFaqId(isExpanded ? null : faq.id);
                        }}
                        style={styles.faqHeaderBtn}
                      >
                        <Text style={styles.faqQuestionText}>{faq.question}</Text>
                        <ChevronRight
                          size={16}
                          color={colors.forest[700]}
                          style={{
                            transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                          }}
                        />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.faqAnswerBox}>
                          <Text style={styles.faqAnswerText}>{faq.answer}</Text>

                          <View style={styles.faqActionRow}>
                            <TouchableOpacity
                              onPress={() => {
                                setCreatedTicketCode(null);
                                setTicketSujet(`Question : ${faq.question}`);
                                handleTabChange('new');
                              }}
                              style={styles.faqTicketBtn}
                            >
                              <PlusCircle size={12} color={colors.forest[950]} />
                              <Text style={styles.faqTicketBtnText}>Créer un ticket sur ce sujet</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Bannière de secours WhatsApp */}
              <View style={styles.wspCardBanner}>
                <View style={styles.wspBannerLeft}>
                  <Sparkles size={20} color="#15803D" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.wspBannerTitle}>Besoin d'une réponse immédiate ?</Text>
                    <Text style={styles.wspBannerSub}>
                      Échangez en direct avec un agent Paixi sur WhatsApp 24h/24.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleOpenWhatsApp}
                  style={styles.wspBannerCta}
                >
                  <MessageSquare size={14} color="#FFFFFF" />
                  <Text style={styles.wspBannerCtaText}>Ouvrir WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ONGLET 2 : MES TICKETS DE SUPPORT
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'tickets' && (
            <View style={styles.tabContentStack}>
              {!isAuthenticated ? (
                <AuthRequiredCard
                  subtitle="Connectez-vous à votre compte Paixi pour créer et suivre l'avancement de vos tickets de support."
                  title="Accédez à vos tickets de support"
                />
              ) : isLoadingTickets ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={colors.forest[800]} />
                  <Text style={styles.loadingText}>Chargement de vos tickets...</Text>
                </View>
              ) : tickets.length === 0 ? (
                <View style={styles.emptyTicketsBox}>
                  <CheckCircle2 size={44} color={colors.forest[700]} />
                  <Text style={styles.emptyTitle}>Aucun ticket en cours</Text>
                  <Text style={styles.emptySub}>
                    Vous n'avez actuellement aucun ticket de support ouvert. Besoin d'aide pour une réservation ou un paiement ?
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setCreatedTicketCode(null);
                      handleTabChange('new');
                    }}
                    style={styles.createFirstBtn}
                  >
                    <PlusCircle size={15} color={colors.forest[950]} />
                    <Text style={styles.createFirstBtnText}>Créer mon premier ticket</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ticketsList}>
                  {tickets.map((t) => {
                    const badge = renderBadgeStatut(t.statut);
                    return (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        key={t.id}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          router.push(`/support/${t.id}`);
                        }}
                        style={styles.ticketCard}
                      >
                        <View style={styles.ticketHeaderRow}>
                          <Text style={styles.ticketCode}>{t.code}</Text>
                          <View
                            style={[
                              styles.ticketBadge,
                              { backgroundColor: badge.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.ticketBadgeText,
                                { color: badge.color },
                              ]}
                            >
                              {badge.label}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.ticketSujet} numberOfLines={2}>
                          {t.sujet}
                        </Text>

                        <View style={styles.ticketFooterRow}>
                          <Text style={styles.ticketDateText}>
                            Modifié le {new Date(t.misAJourLe).toLocaleDateString('fr-FR')}
                          </Text>
                          <View style={styles.ticketChevronRow}>
                            <Text style={styles.ticketDetailLink}>Voir l'échange</Text>
                            <ChevronRight size={14} color={colors.forest[800]} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ONGLET 3 : NOUVEAU TICKET
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'new' && (
            <View style={styles.tabContentStack}>
              {createdTicketCode ? (
                <View style={styles.successTicketBox}>
                  <View style={styles.successIconCircle}>
                    <CheckCircle2 size={40} color={colors.forest[800]} />
                  </View>
                  <Text style={styles.successTicketTitle}>Ticket transmis avec succès !</Text>
                  <Text style={styles.successTicketCode}>Référence : {createdTicketCode}</Text>
                  <Text style={styles.successTicketDesc}>
                    Notre équipe support a bien reçu votre message. Vous serez notifié dès qu'une réponse y sera apportée.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleTabChange('tickets')}
                    style={styles.viewTicketsBtn}
                  >
                    <Ticket size={15} color={colors.forest[950]} />
                    <Text style={styles.viewTicketsBtnText}>Consulter mes tickets</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.formContainer}>
                  <Text style={styles.formSectionTitle}>Créer une demande d'assistance</Text>
                  <Text style={styles.formSectionSub}>
                    Précisez votre demande pour une prise en charge rapide par nos équipes Support & Conciergerie.
                  </Text>

                  {formError && (
                    <View style={styles.errorBox}>
                      <AlertCircle size={15} color={colors.error[700]} />
                      <Text style={styles.errorText}>{formError}</Text>
                    </View>
                  )}

                  {/* Champ Sujet */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Sujet de votre demande <Text style={styles.star}>*</Text>
                    </Text>
                    <TextInput
                      onChangeText={setTicketSujet}
                      placeholder="Ex: Problème paiement Wave, Question caution..."
                      placeholderTextColor={colors.neutral[400]}
                      style={styles.textInput}
                      value={ticketSujet}
                    />
                  </View>

                  {/* Sélecteur Catégorie */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Catégorie</Text>
                    <ScrollView
                      contentContainerStyle={{ gap: 8 }}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {[
                        { key: 'RESERVATION', label: 'Réservation' },
                        { key: 'PAIEMENT', label: 'Paiement Mobile' },
                        { key: 'KYC', label: 'Vérification KYC' },
                        { key: 'LOGEMENT', label: 'Logement' },
                        { key: 'LITIGE', label: 'Litige' },
                        { key: 'AUTRE', label: 'Autre' },
                      ].map((cat) => (
                        <TouchableOpacity
                          key={cat.key}
                          onPress={() => setTicketCategorie(cat.key as CategorieTicket)}
                          style={[
                            styles.selectChip,
                            ticketCategorie === cat.key && styles.selectChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectChipText,
                              ticketCategorie === cat.key && styles.selectChipTextActive,
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Sélecteur Priorité */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Niveau d'Urgence</Text>
                    <View style={styles.prioRow}>
                      {[
                        { key: 'MOYENNE', label: 'Normal' },
                        { key: 'HAUTE', label: 'Haute' },
                        { key: 'URGENTE', label: '🚨 Urgente' },
                      ].map((p) => (
                        <TouchableOpacity
                          key={p.key}
                          onPress={() => setTicketPriorite(p.key as PrioriteTicket)}
                          style={[
                            styles.prioBtn,
                            ticketPriorite === p.key && styles.prioBtnActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.prioBtnText,
                              ticketPriorite === p.key && styles.prioBtnTextActive,
                            ]}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Champ Message */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Description détaillée <Text style={styles.star}>*</Text>
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={5}
                      onChangeText={setTicketMessage}
                      placeholder="Expliquez la situation pour nous aider à vous répondre efficacement..."
                      placeholderTextColor={colors.neutral[400]}
                      style={styles.textAreaInput}
                      textAlignVertical="top"
                      value={ticketMessage}
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                    onPress={handleCreateTicket}
                    style={styles.submitBtn}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.forest[950]} />
                    ) : (
                      <>
                        <Send size={16} color={colors.forest[950]} />
                        <Text style={styles.submitBtnText}>Transmettre à l'équipe Paixi</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    marginHorizontal: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  pulseBadgeText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 8,
    color: '#15803D',
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  wspBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Segmented Control
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
  },
  tabBtnActive: {
    backgroundColor: colors.lime[400],
  },
  tabText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.neutral[600],
  },
  tabTextActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContentStack: {
    gap: 16,
  },

  // FAQ Tab
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.forest[950],
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  chipActive: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
  },
  chipText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[700],
  },
  chipTextActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.lime[400],
  },

  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  faqHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  faqQuestionText: {
    flex: 1,
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
    lineHeight: 18,
  },
  faqAnswerBox: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  faqAnswerText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  faqActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  faqTicketBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },

  wspCardBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
    marginTop: 4,
  },
  wspBannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  wspBannerTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: '#166534',
  },
  wspBannerSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#15803D',
    lineHeight: 16,
  },
  wspBannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#166534',
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  wspBannerCtaText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Tickets Tab
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
  emptyTicketsBox: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  emptyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  emptySub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 17,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  createFirstBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.inner,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketCode: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12,
    color: colors.forest[800],
  },
  ticketBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  ticketBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
  },
  ticketSujet: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.forest[950],
    lineHeight: 18,
  },
  ticketFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  ticketDateText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[400],
  },
  ticketChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketDetailLink: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[800],
  },

  // Form Tab
  formContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  formSectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  formSectionSub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  errorText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.error[700],
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  star: {
    color: colors.error[600],
  },
  textInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.inner,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.forest[950],
  },
  textAreaInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.inner,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.forest[950],
    minHeight: 100,
  },
  selectChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  selectChipActive: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
  },
  selectChipText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[700],
  },
  selectChipTextActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.lime[400],
  },

  prioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prioBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  prioBtnActive: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
  },
  prioBtnText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[700],
  },
  prioBtnTextActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.lime[400],
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginTop: 6,
    ...shadows.action,
  },
  submitBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  successTicketBox: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTicketTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  successTicketCode: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 14,
    color: colors.forest[800],
  },
  successTicketDesc: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 17,
  },
  viewTicketsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  viewTicketsBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
});
