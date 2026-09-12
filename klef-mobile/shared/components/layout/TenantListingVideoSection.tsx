import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Film, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../theme/tokens';

interface TenantListingVideoSectionProps {
  videoUrl: string;
  titre?: string;
  posterUrl?: string;
}

export function TenantListingVideoSection({
  videoUrl,
  titre,
  posterUrl,
}: TenantListingVideoSectionProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.startsWith('http')) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      {/* ── En-tête de section 1:1 avec la version Web ─────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Film size={16} color={colors.forest[700]} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.sectionTitle}>Visite en vidéo</Text>
          <Text style={styles.sectionSubtitle}>
            Les pièces et l’ambiance réelle du logement
          </Text>
        </View>
      </View>

      {/* ── Conteneur Vidéo & Lecteur Multimédia ───────────────────────────── */}
      <View style={styles.videoCard}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          posterSource={posterUrl ? { uri: posterUrl } : undefined}
          usePoster={!isPlaying}
          resizeMode={ResizeMode.COVER}
          useNativeControls={isPlaying}
          isLooping={false}
          onPlaybackStatusUpdate={(s: any) => {
            if (s && s.isLoaded) {
              setIsPlaying(s.isPlaying);
            }
          }}
          style={styles.videoPlayer}
        />

        {/* Overlay avec image de couverture (poster) et Bouton Play ──────── */}
        {!isPlaying && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePlayToggle}
            style={styles.overlayContainer}
          >
            {posterUrl ? (
              <ExpoImage
                source={{ uri: posterUrl }}
                style={styles.posterImage}
                contentFit="cover"
              />
            ) : null}

            {/* Masque sombre de contraste */}
            <View style={styles.darkMask} />

            {/* Bouton Play Flottant */}
            <View style={styles.playButtonWrapper}>
              <View style={styles.playButtonCircle}>
                <Play size={24} color={colors.forest[950]} style={{ marginLeft: 3 }} />
              </View>
              <View style={styles.playBadge}>
                <Text style={styles.playBadgeText}>Lancer la visite vidéo</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    gap: 1,
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },

  videoCard: {
    width: '100%',
    height: 220,
    borderRadius: radius.card,
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  darkMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 25, 18, 0.40)',
  },
  playButtonWrapper: {
    alignItems: 'center',
    gap: 10,
  },
  playButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.lime[400],
    ...shadows.md,
  },
  playBadge: {
    backgroundColor: colors.forest[950],
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  playBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[300],
  },
});
