import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, Mask, Rect } from 'react-native-svg';
import {
  AlertTriangle,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Glasses,
  ImageIcon,
  Lock,
  RotateCcw,
  ScanFace,
  Sun,
  X,
} from 'lucide-react-native';
import { colors, radius, typography } from '../../../theme/tokens';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../../features/auth/stores/auth.store';

const INK = colors.forest[950];
const LIME = colors.lime[400];
const tap = () => Haptics.selectionAsync().catch(() => {});

// ── Pièces acceptées : CNI ou passeport, puis un selfie ──────────────────────

type DocType = 'CNI' | 'PASSEPORT';
type Shot = 'recto' | 'verso' | 'page' | 'selfie';

const DOCS: Record<DocType, { label: string; hint: string; sides: Shot[]; ratio: number; Icon: typeof CreditCard }> = {
  CNI: { label: 'Carte d’identité', hint: 'CNI CEDEAO · recto et verso', sides: ['recto', 'verso'], ratio: 85.6 / 54, Icon: CreditCard },
  PASSEPORT: { label: 'Passeport', hint: 'La page avec votre photo', sides: ['page'], ratio: 125 / 88, Icon: BookOpen },
};

const SHOT: Record<Shot, { title: string; short: string; kicker: string; tips: Array<{ Icon: typeof Sun; label: string }> }> = {
  recto: {
    title: 'Recto de la carte',
    short: 'Recto',
    kicker: 'FACE AVEC LA PHOTO',
    tips: [{ Icon: Sun, label: 'Bonne lumière' }, { Icon: ScanFace, label: 'Pièce entière' }, { Icon: X, label: 'Sans reflet' }],
  },
  verso: {
    title: 'Verso de la carte',
    short: 'Verso',
    kicker: 'FACE ARRIÈRE',
    tips: [{ Icon: Sun, label: 'Bonne lumière' }, { Icon: ScanFace, label: 'Pièce entière' }, { Icon: X, label: 'Sans reflet' }],
  },
  page: {
    title: 'Page du passeport',
    short: 'Passeport',
    kicker: 'LA PAGE AVEC VOTRE PHOTO',
    tips: [{ Icon: Sun, label: 'Bonne lumière' }, { Icon: ScanFace, label: 'Page entière' }, { Icon: X, label: 'Sans reflet' }],
  },
  selfie: {
    title: 'Votre visage',
    short: 'Selfie',
    kicker: 'POUR CONFIRMER QUE C’EST BIEN VOUS',
    tips: [{ Icon: ScanFace, label: 'De face' }, { Icon: Sun, label: 'Bien éclairé' }, { Icon: Glasses, label: 'Sans lunettes' }],
  },
};

interface StepKycProps {
  onDone: () => void;
}

/**
 * Vérification d'identité : la pièce (CNI ou passeport), puis un selfie, chacun en
 * prise de vue guidée. Dossier relu par l'équipe Paixi ; l'hôte voit seulement « Identité vérifiée ».
 */
export function StepKyc({ onDone }: StepKycProps) {
  const { user, setUser, refreshUser } = useAuthStore();
  const [doc, setDoc] = useState<DocType | null>(null);
  const [shots, setShots] = useState<Partial<Record<Shot, string>>>({});
  const [capturing, setCapturing] = useState<Shot | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  // Dossier refusé ou à renouveler : on affiche le motif laissé par l'équipe
  useEffect(() => {
    if (user?.statutKyc !== 'REJETE' && user?.statutKyc !== 'A_RENOUVELER') return;
    apiClient
      .get<any>('/kyc/status')
      .then((res) => setRejection((res.data?.data ?? res.data)?.kycRejectionReason ?? null))
      .catch(() => {});
  }, [user?.statutKyc]);

  const sequence: Shot[] = doc ? [...DOCS[doc].sides, 'selfie'] : [];
  const done = sequence.filter((s) => !!shots[s]).length;
  const ready = sequence.length > 0 && done === sequence.length;

  const chooseDoc = (d: DocType) => {
    tap();
    setDoc(d);
    setShots((prev) => (prev.selfie ? { selfie: prev.selfie } : {}));
    setError(null);
  };

  const submit = async () => {
    if (!doc || !ready) return;
    setSending(true);
    setError(null);
    try {
      const sides = DOCS[doc].sides;
      const [docs, selfie] = await Promise.all([
        Promise.all(sides.map((s) => uploadKycFile(shots[s]!))),
        uploadKycFile(shots.selfie!),
      ]);
      await apiClient.post('/kyc/submit', {
        typeDocument: doc,
        kycDocumentUrl: docs[0].url,
        kycDocumentPublicId: docs[0].publicId,
        ...(doc === 'CNI' && { kycVersoUrl: docs[1].url, kycVersoPublicId: docs[1].publicId }),
        kycSelfieUrl: selfie.url,
        kycSelfiePublicId: selfie.publicId,
      });
      if (user) await setUser({ ...user, statutKyc: 'EN_ATTENTE' });
      refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSent(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(err?.response?.data?.message || 'L’envoi a échoué. Vérifiez votre connexion et réessayez.');
    } finally {
      setSending(false);
    }
  };

  // ── Dossier envoyé ──
  if (sent && doc) {
    return (
      <View style={styles.wrap}>
        <View style={styles.sent}>
          <View style={[styles.ring, styles.ringOuter]} />
          <View style={[styles.ring, styles.ringInner]} />
          <View style={styles.sentStack}>
            {DOCS[doc].sides.map((s, i) => (
              <Image
                key={s}
                source={{ uri: shots[s] }}
                style={[styles.sentCard, { aspectRatio: DOCS[doc].ratio, transform: [{ rotate: `${i === 0 ? -8 : 6}deg` }] }]}
                contentFit="cover"
              />
            ))}
            <Image source={{ uri: shots.selfie }} style={styles.sentFace} contentFit="cover" />
          </View>
          <View style={styles.sentBadge}>
            <Clock size={13} color={INK} />
            <Text style={styles.sentBadgeText}>EN VÉRIFICATION</Text>
          </View>
          <Text style={styles.sentTitle}>
            Dossier envoyé.{'\n'}
            <Text style={styles.accent}>On s’occupe du reste.</Text>
          </Text>
          <Text style={styles.sentText}>
            L’équipe Paixi vérifie votre pièce, en général en moins de 2 heures. Vous recevez une notification dès que c’est fait.
          </Text>
        </View>
        <TouchableOpacity onPress={onDone} style={styles.primary} accessibilityRole="button">
          <Text style={styles.primaryText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {rejection || user?.statutKyc === 'REJETE' ? (
        <View style={styles.rejected}>
          <AlertTriangle size={16} color={colors.error[700]} />
          <View style={styles.flex}>
            <Text style={styles.rejectedTitle}>Votre dossier n’a pas pu être validé</Text>
            <Text style={styles.rejectedText}>{rejection ?? 'Reprenez des photos bien nettes et entières.'}</Text>
          </View>
        </View>
      ) : null}

      {/* 1. Quelle pièce */}
      <Text style={styles.label}>1 · VOTRE PIÈCE</Text>
      <View style={styles.docs}>
        {(Object.keys(DOCS) as DocType[]).map((d) => {
          const { label, hint, Icon } = DOCS[d];
          const active = doc === d;
          return (
            <TouchableOpacity
              key={d}
              onPress={() => chooseDoc(d)}
              activeOpacity={0.85}
              style={[styles.doc, active && styles.docActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              {/* Mini-pièce stylisée */}
              <View style={[styles.docArt, d === 'PASSEPORT' && styles.docArtPassport, active && styles.docArtActive]}>
                <View style={[styles.docArtPhoto, active && { backgroundColor: LIME }]} />
                <View style={styles.docArtLines}>
                  <View style={[styles.docArtLine, active && styles.docArtLineActive]} />
                  <View style={[styles.docArtLine, { width: '60%' }, active && styles.docArtLineActive]} />
                  <View style={[styles.docArtLine, { width: '75%' }, active && styles.docArtLineActive]} />
                </View>
              </View>
              <View style={styles.docText}>
                <Icon size={14} color={active ? INK : colors.neutral[500]} />
                <Text style={[styles.docLabel, active && { color: INK }]}>{label}</Text>
              </View>
              <Text style={styles.docHint}>{hint}</Text>
              <View style={[styles.radio, active && styles.radioOn]}>{active && <Check size={11} color={INK} strokeWidth={3.2} />}</View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Les photos */}
      {doc && (
        <>
          <View style={styles.progressHead}>
            <Text style={styles.label}>2 · LES PHOTOS</Text>
            <Text style={styles.progressCount}>
              {done}/{sequence.length}
            </Text>
          </View>
          <View style={styles.progress}>
            {sequence.map((s) => (
              <View key={s} style={[styles.progressSeg, shots[s] && styles.progressSegOn]} />
            ))}
          </View>

          <View style={styles.slots}>
            {sequence.map((s) => {
              const uri = shots[s];
              const isFace = s === 'selfie';
              return (
                <TouchableOpacity
                  key={s}
                  activeOpacity={0.85}
                  onPress={() => {
                    tap();
                    setCapturing(s);
                  }}
                  style={[styles.slot, uri && styles.slotDone]}
                  accessibilityRole="button"
                  accessibilityLabel={uri ? `Reprendre : ${SHOT[s].title}` : `Photographier : ${SHOT[s].title}`}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={isFace ? styles.slotFace : [styles.slotThumb, { aspectRatio: DOCS[doc].ratio }]}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[isFace ? styles.slotFace : [styles.slotThumb, { aspectRatio: DOCS[doc].ratio }], styles.slotEmpty]}>
                      {isFace ? <ScanFace size={18} color={colors.forest[600]} /> : <Camera size={18} color={colors.forest[600]} />}
                    </View>
                  )}
                  <View style={styles.flex}>
                    <Text style={styles.slotTitle}>{SHOT[s].title}</Text>
                    <Text style={[styles.slotSub, uri && { color: colors.forest[600] }]}>
                      {uri ? 'Ajoutée · toucher pour reprendre' : isFace ? 'Caméra frontale · 10 secondes' : 'Photographier'}
                    </Text>
                  </View>
                  {uri ? (
                    <View style={styles.slotOk}>
                      <Check size={13} color={LIME} strokeWidth={3} />
                    </View>
                  ) : (
                    <View style={styles.slotGo}>
                      <ChevronRight size={16} color={INK} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <View style={styles.privacy}>
        <Lock size={14} color={colors.forest[600]} />
        <Text style={styles.privacyText}>
          Votre pièce et votre selfie sont chiffrés et vus uniquement par l’équipe Paixi. Votre hôte voit seulement « Identité vérifiée ».
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        onPress={submit}
        disabled={!ready || sending}
        style={[styles.primary, (!ready || sending) && styles.primaryOff]}
        accessibilityRole="button"
      >
        {sending ? (
          <ActivityIndicator color={LIME} />
        ) : (
          <Text style={styles.primaryText}>
            {!doc ? 'Choisissez votre pièce' : ready ? 'Envoyer pour vérification' : `Encore ${sequence.length - done} photo${sequence.length - done > 1 ? 's' : ''}`}
          </Text>
        )}
      </TouchableOpacity>

      {doc && capturing && (
        <GuidedCamera
          shot={capturing}
          ratio={DOCS[doc].ratio}
          sequence={sequence}
          taken={shots}
          onClose={() => setCapturing(null)}
          onCapture={(uri) => {
            const next = sequence.find((s) => s !== capturing && !shots[s]);
            setShots((prev) => ({ ...prev, [capturing]: uri }));
            // On enchaîne sur la photo suivante, jusqu'au selfie
            setCapturing(next ?? null);
          }}
        />
      )}
    </View>
  );
}

// ── Prise de vue guidée ──────────────────────────────────────────────────────

function GuidedCamera({
  shot,
  ratio,
  sequence,
  taken,
  onCapture,
  onClose,
}: {
  shot: Shot;
  ratio: number;
  sequence: Shot[];
  taken: Partial<Record<Shot, string>>;
  onCapture: (uri: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  const isFace = shot === 'selfie';
  const meta = SHOT[shot];

  // Cadre : carte au format de la pièce, ovale pour le visage
  // Petits écrans : l'ovale ne doit pas passer sous le titre
  const fw = isFace ? Math.min(W * 0.66, (H * 0.46) / 1.32) : W - 48;
  const fh = isFace ? fw * 1.32 : fw / ratio;
  const fx = (W - fw) / 2;
  const fy = H * (isFace ? 0.42 : 0.44) - fh / 2;

  useEffect(() => {
    setPreview(null);
  }, [shot]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const shoot = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 380, useNativeDriver: true }).start();
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) setPreview(photo.uri);
    } finally {
      setBusy(false);
    }
  };

  const fromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!res.canceled && res.assets?.[0]?.uri) setPreview(res.assets[0].uri);
  };

  const accept = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      onCapture(await shrink(preview));
    } finally {
      setBusy(false);
    }
  };

  const outlineOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const index = sequence.indexOf(shot);

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.cam}>
        {preview ? (
          <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : permission?.granted ? (
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={isFace ? 'front' : 'back'} mirror={isFace} />
        ) : null}

        {/* Voile avec la découpe du cadre */}
        {(permission?.granted || preview) && (
          <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <Mask id="cut">
                <Rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
                {isFace ? (
                  <Ellipse cx={W / 2} cy={fy + fh / 2} rx={fw / 2} ry={fh / 2} fill="#000000" />
                ) : (
                  <Rect x={fx} y={fy} width={fw} height={fh} rx={18} fill="#000000" />
                )}
              </Mask>
            </Defs>
            <Rect x={0} y={0} width={W} height={H} fill={preview ? 'rgba(4,25,18,0.55)' : 'rgba(4,25,18,0.78)'} mask="url(#cut)" />
          </Svg>
        )}

        {/* Contour qui respire */}
        {(permission?.granted || preview) && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: preview ? 1 : outlineOpacity }]} pointerEvents="none">
            <Svg width={W} height={H}>
              {isFace ? (
                <Ellipse
                  cx={W / 2}
                  cy={fy + fh / 2}
                  rx={fw / 2}
                  ry={fh / 2}
                  fill="none"
                  stroke={LIME}
                  strokeWidth={3}
                  strokeDasharray={preview ? undefined : '10 8'}
                />
              ) : (
                <Rect x={fx} y={fy} width={fw} height={fh} rx={18} fill="none" stroke={LIME} strokeWidth={3} />
              )}
            </Svg>
          </Animated.View>
        )}

        {/* Éclair de déclenchement */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: flash }]} />

        {/* En-tête : progression + titre */}
        <View style={[styles.camTop, { paddingTop: insets.top + 10 }]}>
          <View style={styles.camTopRow}>
            <TouchableOpacity onPress={onClose} style={styles.glassBtn} accessibilityLabel="Fermer">
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.camSteps}>
              {sequence.map((s, i) => (
                <View key={s} style={[styles.camStep, (taken[s] || i < index) && styles.camStepDone, s === shot && styles.camStepNow]} />
              ))}
            </View>
            <Text style={styles.camCount}>
              {index + 1}/{sequence.length}
            </Text>
          </View>
          <Text style={styles.camKicker}>{preview ? 'VÉRIFIEZ LA PHOTO' : meta.kicker}</Text>
          <Text style={styles.camTitle}>{preview ? (isFace ? 'Votre visage est-il net ?' : 'Tout est lisible ?') : meta.title}</Text>
        </View>

        {/* Permission refusée */}
        {!preview && permission && !permission.granted && (
          <View style={styles.camPermission}>
            <View style={styles.permIcon}>
              <Camera size={26} color={INK} />
            </View>
            <Text style={styles.camPermTitle}>Autorisez l’appareil photo</Text>
            <Text style={styles.camPermText}>
              {isFace ? 'Pour prendre votre selfie de vérification.' : 'Pour photographier votre pièce. Vous pouvez aussi importer une photo.'}
            </Text>
            <TouchableOpacity onPress={requestPermission} style={[styles.camBtn, styles.camBtnLime, { alignSelf: 'stretch', flex: 0 }]} accessibilityRole="button">
              <Text style={styles.camBtnLimeText}>Autoriser</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bas : conseils + déclencheur, ou validation */}
        <View style={[styles.camBottom, { paddingBottom: insets.bottom + 20 }]}>
          {preview ? (
            <>
              <Text style={styles.camHint}>
                {isFace ? 'Visage entier dans l’ovale, yeux ouverts, sans flou.' : 'Texte lisible, quatre coins visibles, sans reflet.'}
              </Text>
              <View style={styles.camActions}>
                <TouchableOpacity onPress={() => setPreview(null)} style={[styles.camBtn, styles.camBtnGhost]} accessibilityRole="button">
                  <RotateCcw size={16} color="#FFFFFF" />
                  <Text style={styles.camBtnGhostText}>Reprendre</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={accept} disabled={busy} style={[styles.camBtn, styles.camBtnLime]} accessibilityRole="button">
                  {busy ? <ActivityIndicator color={INK} /> : <Check size={17} color={INK} strokeWidth={3} />}
                  <Text style={styles.camBtnLimeText}>{index < sequence.length - 1 && !taken[sequence[index + 1]] ? 'Suivant' : 'Utiliser'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.tips}>
                {meta.tips.map(({ Icon, label }) => (
                  <View key={label} style={styles.tip}>
                    <Icon size={13} color={LIME} />
                    <Text style={styles.tipText}>{label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.shutterRow}>
                {isFace ? (
                  <View style={styles.sideSlot} />
                ) : (
                  <TouchableOpacity onPress={fromGallery} style={styles.glassBtnLg} accessibilityLabel="Importer une photo">
                    <ImageIcon size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={shoot}
                  disabled={!permission?.granted || busy}
                  style={[styles.shutter, !permission?.granted && { opacity: 0.35 }]}
                  accessibilityLabel="Prendre la photo"
                >
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
                <View style={styles.sideSlot} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Préparation et envoi ─────────────────────────────────────────────────────

/** Ramène la photo sous la limite d'envoi (5 Mo) sans perdre la lisibilité. */
async function shrink(uri: string): Promise<string> {
  try {
    const ref = await ImageManipulator.manipulate(uri).resize({ width: 1600 }).renderAsync();
    const out = await ref.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
    return out.uri;
  } catch {
    return uri;
  }
}

async function uploadKycFile(uri: string): Promise<{ url: string; publicId: string }> {
  let cleanUri = uri;
  if (Platform.OS === 'android' && !/^(file|content|https?):\/\//.test(cleanUri)) cleanUri = `file://${cleanUri}`;
  const filename = cleanUri.split('/').pop()?.split('?')[0] || 'kyc.jpg';
  const ext = (/\.(\w+)$/.exec(filename)?.[1] ?? 'jpg').toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri: cleanUri, name: filename, type } as any);
  const res = await apiClient.post('/upload/kyc-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  const data = res.data?.data || res.data;
  const url = data.url || data.secure_url;
  if (!url) throw new Error('Envoi de la photo impossible');
  return { url, publicId: data.publicId || data.public_id || `kyc_${Date.now()}` };
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  label: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.3, color: colors.neutral[500], marginTop: 4 },
  accent: { color: LIME, fontStyle: 'italic' },

  rejected: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, backgroundColor: colors.error[50] },
  rejectedTitle: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.error[700] },
  rejectedText: { fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 18, color: colors.error[700], marginTop: 2 },

  // Choix de la pièce
  docs: { flexDirection: 'row', gap: 10 },
  doc: {
    flex: 1,
    gap: 4,
    padding: 12,
    paddingBottom: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  docActive: { borderColor: INK, backgroundColor: colors.lime[50] },
  docArt: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    height: 58,
    padding: 9,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
  },
  docArtPassport: { height: 64, borderRadius: 8, borderLeftWidth: 5, borderLeftColor: colors.neutral[300] },
  docArtActive: { backgroundColor: INK, borderLeftColor: colors.forest[700] },
  docArtPhoto: { width: 28, height: '100%', borderRadius: 6, backgroundColor: colors.neutral[300] },
  docArtLines: { flex: 1, gap: 5 },
  docArtLine: { height: 4, width: '90%', borderRadius: 2, backgroundColor: colors.neutral[300] },
  docArtLineActive: { backgroundColor: 'rgba(211,242,110,0.45)' },
  docText: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docLabel: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.neutral[800] },
  docHint: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 16, color: colors.neutral[500] },
  radio: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: LIME, backgroundColor: LIME },

  // Photos
  progressHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  progressCount: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15, color: INK },
  progress: { flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.neutral[200] },
  progressSegOn: { backgroundColor: INK },
  slots: { gap: 8 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  slotDone: { borderColor: colors.forest[200], backgroundColor: colors.forest[50] },
  slotThumb: { width: 72, borderRadius: 10 },
  slotFace: { width: 46, height: 58, borderRadius: 23, marginHorizontal: 13 },
  slotEmpty: { backgroundColor: colors.neutral[100], borderWidth: 1, borderStyle: 'dashed', borderColor: colors.neutral[300], alignItems: 'center', justifyContent: 'center' },
  slotTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.neutral[900] },
  slotSub: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  slotOk: { width: 28, height: 28, borderRadius: 14, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  slotGo: { width: 28, height: 28, borderRadius: 14, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },

  privacy: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, backgroundColor: colors.forest[50] },
  privacyText: { flex: 1, fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 18, color: colors.forest[800] },
  error: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.error[700] },

  primary: { height: 56, borderRadius: radius.pill, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryOff: { opacity: 0.4 },
  primaryText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: LIME },

  // Envoyé
  sent: { alignItems: 'center', gap: 10, paddingTop: 26, paddingBottom: 24, paddingHorizontal: 20, borderRadius: 28, overflow: 'hidden', backgroundColor: INK },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 280, height: 280, borderRadius: 140, top: -60 },
  ringInner: { width: 180, height: 180, borderRadius: 90, top: -10, borderColor: 'rgba(211,242,110,0.2)' },
  sentStack: { width: 200, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  sentCard: {
    position: 'absolute',
    width: 130,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  sentFace: {
    position: 'absolute',
    right: 4,
    bottom: -6,
    width: 58,
    height: 72,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: LIME,
  },
  sentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: LIME },
  sentBadgeText: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.1, color: INK },
  sentTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: '#FFFFFF', textAlign: 'center', marginTop: 4 },
  sentText: { fontFamily: typography.fontBody, fontSize: 13.5, lineHeight: 20, color: colors.forest[200], textAlign: 'center' },

  // Caméra
  cam: { flex: 1, backgroundColor: INK },
  camTop: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 18, gap: 4 },
  camTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  glassBtnLg: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  camSteps: { flex: 1, flexDirection: 'row', gap: 6 },
  camStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)' },
  camStepDone: { backgroundColor: 'rgba(211,242,110,0.6)' },
  camStepNow: { backgroundColor: LIME },
  camCount: { fontFamily: typography.fontBodyBold, fontSize: 13, color: '#FFFFFF' },
  camKicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.3, color: LIME },
  camTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.6, color: '#FFFFFF' },
  camPermission: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  permIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  camPermTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, color: '#FFFFFF' },
  camPermText: { fontFamily: typography.fontBody, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 10 },
  camBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 18, paddingHorizontal: 22 },
  tips: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tipText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: '#FFFFFF' },
  camHint: { fontFamily: typography.fontBodySemiBold, fontSize: 13.5, lineHeight: 19, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  sideSlot: { width: 52, height: 52 },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: LIME },
  camActions: { flexDirection: 'row', gap: 10 },
  camBtn: { flex: 1, flexDirection: 'row', gap: 8, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  camBtnGhost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  camBtnGhostText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: '#FFFFFF' },
  camBtnLime: { backgroundColor: LIME },
  camBtnLimeText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
});
