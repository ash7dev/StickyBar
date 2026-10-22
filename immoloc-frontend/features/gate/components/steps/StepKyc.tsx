'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Camera, Check, Clock, CreditCard, Loader2, Lock, ScanFace } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { cn } from '@/lib/utils/cn';

interface Props { onDone: () => void }

// ── Pièces acceptées : CNI ou passeport, comme dans l'app ────────────────────

type DocType = 'CNI' | 'PASSEPORT';
type Side = 'recto' | 'verso' | 'page' | 'selfie';

const DOCS: Record<DocType, { label: string; hint: string; sides: Side[]; ratio: string; Icon: typeof CreditCard }> = {
  CNI: { label: 'Carte d’identité', hint: 'CNI CEDEAO · recto et verso', sides: ['recto', 'verso'], ratio: 'aspect-[85.6/54]', Icon: CreditCard },
  PASSEPORT: { label: 'Passeport', hint: 'La page avec votre photo', sides: ['page'], ratio: 'aspect-[125/88]', Icon: BookOpen },
};

const SIDE_LABEL: Record<Side, string> = {
  recto: 'Recto · face avec la photo',
  verso: 'Verso · face arrière',
  page: 'Page avec la photo',
  selfie: 'Votre visage',
};

const MAX_INPUT = 20 * 1024 * 1024;

/** Réduit la photo (1600 px, JPEG) : le serveur refuse au-delà de 5 Mo. */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
    return blob ? new File([blob], 'kyc.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

async function uploadKycFile(file: File, token: string): Promise<{ url: string; publicId: string }> {
  const form = new FormData();
  form.append('file', file);
  return nestFetch(NEST_API.UPLOAD.KYC_DOCUMENT, {
    method: 'POST',
    token,
    body: form,
    skipContentType: true,
  });
}

/**
 * Vérification d'identité : choix de la pièce, une photo par face, envoi à
 * l'équipe Paixi. L'hôte voit seulement « Identité vérifiée ».
 */
export function StepKyc({ onDone }: Props) {
  const { setGateStatus } = useRoleStore();
  const { refreshIfNeeded } = useNestToken();
  const input = useRef<HTMLInputElement>(null);
  const faceInput = useRef<HTMLInputElement>(null);

  const [doc, setDoc] = useState<DocType | null>(null);
  const [files, setFiles] = useState<Partial<Record<Side, { file: File; preview: string }>>>({});
  const [picking, setPicking] = useState<Side | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Libère les aperçus à la fermeture de l'étape
  const previews = useRef<Partial<Record<Side, { file: File; preview: string }>>>({});
  useEffect(() => {
    previews.current = files;
  }, [files]);
  useEffect(() => () => Object.values(previews.current).forEach((f) => f && URL.revokeObjectURL(f.preview)), []);

  const sides = doc ? DOCS[doc].sides : [];
  const sequence: Side[] = doc ? [...sides, 'selfie'] : [];
  const done = sequence.filter((s) => !!files[s]).length;
  const ready = sequence.length > 0 && done === sequence.length;

  const pick = (side: Side) => {
    setPicking(side);
    // Selfie : sur téléphone, le navigateur ouvre directement la caméra frontale
    (side === 'selfie' ? faceInput : input).current?.click();
  };

  const onFile = useCallback(
    async (raw: File | undefined) => {
      if (!raw || !picking) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(raw.type)) {
        setError('Format non pris en charge : utilisez une photo JPG, PNG ou WebP.');
        return;
      }
      if (raw.size > MAX_INPUT) {
        setError('Photo trop lourde (20 Mo maximum).');
        return;
      }
      setError('');
      const file = await shrink(raw);
      setFiles((prev) => {
        const old = prev[picking];
        if (old) URL.revokeObjectURL(old.preview);
        return { ...prev, [picking]: { file, preview: URL.createObjectURL(file) } };
      });
    },
    [picking],
  );

  async function submit() {
    if (!doc || !ready) return;
    setLoading(true);
    setError('');
    try {
      const token = (await refreshIfNeeded()) ?? '';
      const [uploads, selfie] = await Promise.all([
        Promise.all(sides.map((s) => uploadKycFile(files[s]!.file, token))),
        uploadKycFile(files.selfie!.file, token),
      ]);
      await nestFetch(NEST_API.KYC.SUBMIT, {
        method: 'POST',
        token,
        body: JSON.stringify({
          typeDocument: doc,
          kycDocumentUrl: uploads[0].url,
          kycDocumentPublicId: uploads[0].publicId,
          ...(doc === 'CNI' && { kycVersoUrl: uploads[1].url, kycVersoPublicId: uploads[1].publicId }),
          kycSelfieUrl: selfie.url,
          kycSelfiePublicId: selfie.publicId,
        }),
      });
      setGateStatus({ statutKyc: 'EN_ATTENTE' });
      setSent(true);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'L’envoi a échoué. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (sent && doc) {
    return (
      <div className="space-y-4">
        <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-[1.75rem] bg-forest-950 px-6 pb-7 pt-8 text-center">
          <span aria-hidden="true" className="absolute -top-16 h-72 w-72 rounded-full border border-lime-400/10" />
          <span aria-hidden="true" className="absolute -top-2 h-44 w-44 rounded-full border border-lime-400/20" />
          {/* Le dossier, en éventail */}
          <div className="relative mb-2 h-28 w-52">
            {sides.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s}
                src={files[s]?.preview}
                alt=""
                className={cn(
                  'absolute left-1/2 top-1/2 w-32 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-white/85 object-cover shadow-xl',
                  DOCS[doc].ratio,
                  i === 0 ? '-rotate-[8deg]' : 'rotate-[6deg]',
                )}
              />
            ))}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={files.selfie?.preview}
              alt=""
              className="absolute -bottom-2 right-1 h-[4.5rem] w-14 rounded-full border-[3px] border-lime-400 object-cover shadow-xl"
            />
          </div>
          <span className="relative inline-flex h-7 items-center gap-1.5 rounded-pill bg-lime-400 px-3 text-[0.65rem] font-bold tracking-widest text-forest-950">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> EN VÉRIFICATION
          </span>
          <p className="relative font-display text-2xl font-semibold leading-tight text-white">
            Dossier envoyé.
            <br />
            <em className="text-lime-400">On s’occupe du reste.</em>
          </p>
          <p className="relative text-sm leading-relaxed text-forest-200">
            L’équipe Paixi vérifie votre pièce, en général en moins de 2 heures. Vous recevez une notification dès que c’est fait.
          </p>
        </div>
        <button type="button" onClick={onDone} className="btn-action w-full justify-center">
          Continuer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Quelle pièce */}
      <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">1 · Votre pièce</p>
      <div className="grid grid-cols-2 gap-3" role="radiogroup">
        {(Object.keys(DOCS) as DocType[]).map((d) => {
          const { label, hint, Icon } = DOCS[d];
          const active = doc === d;
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setDoc(d);
                // Le selfie reste valable si l'on change de pièce
                setFiles((prev) => (prev.selfie ? { selfie: prev.selfie } : {}));
                setError('');
              }}
              className={cn(
                'relative flex flex-col items-start gap-1 rounded-card border-2 bg-background-card p-4 text-left transition-colors',
                active ? 'border-forest-950' : 'border-border hover:border-border-hover',
              )}
            >
              <span
                className={cn(
                  'mb-1.5 flex h-10 w-10 items-center justify-center rounded-full',
                  active ? 'bg-forest-950 text-lime-400' : 'bg-background-alt text-forest-950',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold text-foreground">{label}</span>
              <span className="text-xs leading-snug text-foreground-muted">{hint}</span>
              {active && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-lime-400 text-forest-950">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Les photos */}
      {doc && (
        <>
          <div className="flex items-baseline justify-between">
            <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">2 · Les photos</p>
            <p className="font-display text-sm font-semibold text-forest-950">
              {done}/{sequence.length}
            </p>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {sequence.map((s) => (
              <span key={s} className={cn('h-1 flex-1 rounded-full transition-colors', files[s] ? 'bg-forest-950' : 'bg-border')} />
            ))}
          </div>
          <div className="space-y-2.5">
            {sequence.map((side) => {
              const f = files[side];
              const face = side === 'selfie';
              const thumb = face ? 'mx-3 h-14 w-11 rounded-full' : cn('w-20 rounded-inner', DOCS[doc].ratio);
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => pick(side)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-card border p-2.5 text-left transition-colors',
                    f ? 'border-forest-200 bg-forest-50' : 'border-border bg-background-card hover:border-border-hover',
                  )}
                >
                  {f ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.preview} alt="" className={cn('shrink-0 object-cover', thumb)} />
                  ) : (
                    <span
                      className={cn(
                        'flex shrink-0 items-center justify-center border border-dashed border-border bg-background-alt text-forest-600',
                        thumb,
                      )}
                    >
                      {face ? <ScanFace className="h-4 w-4" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-foreground">{SIDE_LABEL[side]}</span>
                    <span className={cn('block text-xs font-semibold', f ? 'text-forest-600' : 'text-foreground-muted')}>
                      {f ? 'Ajoutée · cliquer pour la remplacer' : face ? 'De face, bien éclairé, sans lunettes' : 'Prendre ou choisir une photo'}
                    </span>
                  </span>
                  {f ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-950 text-lime-400">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-400 text-forest-950">
                      <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-foreground-muted">Bonne lumière, sans reflet, pièce entière et texte lisible.</p>
        </>
      )}

      <div className="flex items-start gap-2.5 rounded-card bg-forest-50 p-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-forest-800">
          Votre pièce et votre selfie sont chiffrés et vus uniquement par l’équipe Paixi. Votre hôte voit seulement « Identité vérifiée ».
        </p>
      </div>

      {error && (
        <p className="rounded-inner border border-error-500/30 bg-error-50 px-3 py-2 text-xs font-semibold text-error-700">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!ready || loading}
        className="btn-action w-full justify-center disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Envoi en cours…
          </>
        ) : !doc ? (
          'Choisissez votre pièce'
        ) : ready ? (
          'Envoyer pour vérification'
        ) : (
          `Encore ${sequence.length - done} photo${sequence.length - done > 1 ? 's' : ''}`
        )}
      </button>

      {/* Sur téléphone, le navigateur propose l'appareil photo ou la galerie */}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={faceInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
