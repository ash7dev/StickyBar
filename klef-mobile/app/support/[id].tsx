import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Send,
  Sparkles,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { supportApi, TicketSupport, TicketMessage } from '../../shared/api/support.api';

export default function TicketDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // React Query pour récupérer les détails du ticket
  const {
    data: ticket,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['support', 'ticket', id],
    queryFn: () => supportApi.getTicketDetails(id!),
    enabled: Boolean(id),
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000, // Rafraîchissement automatique toutes les 15s
  });

  // Auto-scroll vers le bas lors de la réception de messages
  useEffect(() => {
    if (ticket?.messages?.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [ticket?.messages?.length]);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !id) return;

    setIsSending(true);
    setSendError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      await supportApi.addTicketMessage(id, replyMessage.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setReplyMessage('');
      refetch();
    } catch (err: any) {
      console.error('[TicketDetailScreen] Send reply error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setSendError(
        err?.response?.data?.message ||
          "Une erreur est survenue lors de l'envoi de votre message."
      );
    } finally {
      setIsSending(false);
    }
  };

  const renderBadgeStatut = (statut?: string) => {
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
        return { label: statut || '', bg: colors.neutral[100], color: colors.neutral[700] };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.forest[950]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Support</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.forest[800]} />
          <Text style={styles.loadingText}>Chargement de la conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.forest[950]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Introuvable</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingCenter}>
          <HelpCircle size={44} color={colors.neutral[400]} />
          <Text style={styles.errorTitle}>Ce ticket n'existe pas ou n'est plus accessible.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.returnBtn}>
            <Text style={styles.returnBtnText}>Retour à l'assistance</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badge = renderBadgeStatut(ticket.statut);

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.codeText}>{ticket.code}</Text>
            <View style={[styles.statutBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statutBadgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          <View style={{ width: 38 }} />
        </View>

        {/* ── BANNIÈRE SUJET ──────────────────────────────────────────────── */}
        <View style={styles.sujetBanner}>
          <Text style={styles.sujetTitle}>{ticket.sujet}</Text>
          <View style={styles.sujetMetaRow}>
            <Text style={styles.sujetMetaText}>Catégorie : {ticket.categorie}</Text>
            <Text style={styles.sujetMetaText}>•</Text>
            <Text style={styles.sujetMetaText}>
              Créé le {new Date(ticket.creeLe).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        {/* ── FIL DE DISCUSSION ───────────────────────────────────────────── */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.forest[800]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {ticket.messages.map((msg) => {
            const isAdmin = msg.estAdmin;
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isAdmin ? styles.wrapperAdmin : styles.wrapperUser,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isAdmin ? styles.bubbleAdmin : styles.bubbleUser,
                  ]}
                >
                  <View style={styles.authorHeader}>
                    {isAdmin ? (
                      <View style={styles.adminBadgeRow}>
                        <Sparkles size={12} color={colors.lime[400]} />
                        <Text style={styles.authorAdminText}>Équipe Support Paixi</Text>
                      </View>
                    ) : (
                      <Text style={styles.authorUserText}>Vous</Text>
                    )}
                    <Text
                      style={[
                        styles.timeText,
                        isAdmin && { color: 'rgba(255,255,255,0.6)' },
                      ]}
                    >
                      {new Date(msg.creeLe).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.messageContentText,
                      isAdmin ? styles.textAdmin : styles.textUser,
                    ]}
                  >
                    {msg.message}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ── ZONE DE RÉPONSE STICKY FOOTER ───────────────────────────────── */}
        {ticket.statut === 'RESOLU' || ticket.statut === 'FERME' ? (
          <View style={styles.closedFooter}>
            <CheckCircle2 size={16} color={colors.neutral[500]} />
            <Text style={styles.closedFooterText}>
              Ce ticket est {ticket.statut === 'RESOLU' ? 'résolu' : 'fermé'}. Vous pouvez créer un nouveau ticket si besoin.
            </Text>
          </View>
        ) : (
          <View style={styles.replyFooter}>
            {sendError && (
              <View style={styles.replyErrorBox}>
                <AlertCircle size={14} color={colors.error[700]} />
                <Text style={styles.replyErrorText}>{sendError}</Text>
              </View>
            )}

            <View style={styles.inputRow}>
              <TextInput
                multiline
                onChangeText={setReplyMessage}
                placeholder="Répondre au support Paixi..."
                placeholderTextColor={colors.neutral[400]}
                style={styles.replyInput}
                value={replyMessage}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isSending || !replyMessage.trim()}
                onPress={handleSendReply}
                style={[
                  styles.sendBtn,
                  (!replyMessage.trim() || isSending) && styles.sendBtnDisabled,
                ]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.forest[950]} />
                ) : (
                  <Send size={16} color={colors.forest[950]} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  codeText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  statutBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  statutBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
  },

  sujetBanner: {
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: 4,
  },
  sujetTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[950],
    lineHeight: 19,
  },
  sujetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sujetMetaText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
  },
  errorTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  returnBtn: {
    backgroundColor: colors.forest[950],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    marginTop: 8,
  },
  returnBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.lime[400],
  },

  messagesContainer: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    width: '100%',
    flexDirection: 'row',
  },
  wrapperAdmin: {
    justifyContent: 'flex-start',
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: radius.card,
    padding: 12,
    gap: 6,
    ...shadows.sm,
  },
  bubbleAdmin: {
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.forest[800],
  },
  bubbleUser: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorAdminText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[400],
  },
  authorUserText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[800],
  },
  timeText: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[400],
  },

  messageContentText: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    lineHeight: 19,
  },
  textAdmin: {
    color: '#FFFFFF',
  },
  textUser: {
    color: colors.forest[950],
  },

  replyFooter: {
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    padding: 12,
    gap: 8,
  },
  replyErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.error[50],
    padding: 8,
    borderRadius: radius.inner,
  },
  replyErrorText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.error[700],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.inner,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.forest[950],
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },

  closedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.neutral[100],
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  closedFooterText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },
});
