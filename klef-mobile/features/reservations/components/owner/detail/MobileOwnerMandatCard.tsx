import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { ShieldCheck, Phone } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ReservationDetail } from '../../../types/reservation-detail.types';

interface MobileOwnerMandatCardProps {
  reservation: ReservationDetail;
}

export function MobileOwnerMandatCard({ reservation }: MobileOwnerMandatCardProps) {
  const { proprietaire, logement, mandatType } = reservation;
  const gestionnaire = (logement as any)?.gestionnaire;

  const isDelegated = Boolean(gestionnaire || mandatType === 'DELEGUE');

  return (
    <View style={styles.cardContainer}>
      {/* ── En-tête (Carte Blanche Pro) ─────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <ShieldCheck size={18} color={colors.lime[400]} />
        </View>
        <View style={styles.headerTitleCol}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            Traçabilité & Mandat de Gestion
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            Habilitation contractuelle du logement
          </Text>
        </View>
      </View>

      {/* ── Banner Statut du Mandat ────────────────────────────────────── */}
      <View style={isDelegated ? styles.mandatBannerBlue : styles.mandatBannerGreen}>
        <ShieldCheck
          size={16}
          color={isDelegated ? '#2563EB' : '#059669'}
          style={styles.bannerIcon}
        />
        <View style={styles.bannerTextCol}>
          <Text style={isDelegated ? styles.bannerTitleBlue : styles.bannerTitleGreen}>
            {isDelegated ? 'Mandat Délégué Actif' : 'Gestion Directe Propriétaire'}
          </Text>
          <Text style={isDelegated ? styles.bannerSubBlue : styles.bannerSubGreen}>
            {isDelegated && gestionnaire
              ? `Ce bien est géré par ${gestionnaire.prenom} ${gestionnaire.nom} pour le compte du propriétaire titulaire.`
              : `Ce logement est géré directement par le propriétaire titulaire ${proprietaire?.prenom || ''} ${proprietaire?.nom || ''}.`}
          </Text>
        </View>
      </View>

      {/* ── Fiches des Intervenants ─────────────────────────────────────── */}
      <View style={styles.cardsGrid}>
        {/* Propriétaire Titulaire */}
        <View style={styles.personCard}>
          <View style={styles.avatarWrapper}>
            {proprietaire?.avatarUrl ? (
              <Image source={{ uri: proprietaire.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarCircleDark}>
                <Text style={styles.initialsDark}>
                  {`${proprietaire?.prenom?.[0] || ''}${proprietaire?.nom?.[0] || ''}`.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.roleLabel}>Propriétaire Titulaire</Text>
            <Text style={styles.personName} numberOfLines={1}>
              {proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : 'Propriétaire'}
            </Text>
            {proprietaire?.telephone && (
              <View style={styles.phoneRow}>
                <Phone size={11} color="#64748B" />
                <Text style={styles.phoneText}>{proprietaire.telephone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Gestionnaire Délégué si présent */}
        {isDelegated && gestionnaire ? (
          <View style={[styles.personCard, styles.managerCard]}>
            <View style={styles.avatarWrapper}>
              {gestionnaire.avatarUrl ? (
                <Image source={{ uri: gestionnaire.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarCircleBlue}>
                  <Text style={styles.initialsBlue}>
                    {`${gestionnaire.prenom?.[0] || ''}${gestionnaire.nom?.[0] || ''}`.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.roleLabelBlue}>Gestionnaire Délégué</Text>
              <Text style={styles.personNameBlue} numberOfLines={1}>
                {`${gestionnaire.prenom} ${gestionnaire.nom}`}
              </Text>
              {gestionnaire.telephone && (
                <View style={styles.phoneRow}>
                  <Phone size={11} color="#2563EB" />
                  <Text style={styles.phoneTextBlue}>{gestionnaire.telephone}</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
    gap: 16,
  },

  /* En-tête */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: '#0F172A',
  },
  cardSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Bannières de Statut */
  mandatBannerGreen: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: radius.inner,
  },
  mandatBannerBlue: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    borderRadius: radius.inner,
  },
  bannerIcon: {
    marginTop: 2,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitleGreen: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#065F46',
  },
  bannerSubGreen: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#047857',
    lineHeight: 17,
    marginTop: 2,
  },
  bannerTitleBlue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#1E40AF',
  },
  bannerSubBlue: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 17,
    marginTop: 2,
  },

  /* Grille des Intervenants */
  cardsGrid: {
    gap: 10,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.inner,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  managerCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarCircleDark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsDark: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.lime[400],
  },
  avatarCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsBlue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: '#1E40AF',
  },
  personInfo: {
    flex: 1,
    gap: 2,
  },
  roleLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleLabelBlue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  personName: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: '#0F172A',
  },
  personNameBlue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: '#1E3A8A',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#64748B',
  },
  phoneTextBlue: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#2563EB',
  },
});
