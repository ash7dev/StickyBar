'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, CheckCircle2, X, Loader2, CreditCard, ArrowRight, AlertCircle, ImageIcon } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { cn } from '@/lib/utils/cn';

interface Props { onDone: () => void }

type KycSubStep = 'recto' | 'verso';

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

export function StepKyc({ onDone }: Props) {
  const { setGateStatus } = useRoleStore();
  const { refreshIfNeeded } = useNestToken();

  const rectoRef = useRef<HTMLInputElement>(null);
  const versoRef = useRef<HTMLInputElement>(null);

  const [subStep, setSubStep] = useState<KycSubStep>('recto');
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [rectoPreview, setRectoPreview] = useState<string | null>(null);
  const [versoPreview, setVersoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = useCallback((file: File, side: KycSubStep) => {
    // Validate file
    const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
    if (file.size > MAX_SIZE) {
      setError('Le fichier est trop volumineux (max 5 Mo).');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format non pris en charge. Utilisez JPG, PNG ou WebP.');
      return;
    }
    setError('');

    // Create preview
    const url = URL.createObjectURL(file);
    if (side === 'recto') {
      setRectoFile(file);
      setRectoPreview(url);
    } else {
      setVersoFile(file);
      setVersoPreview(url);
    }
  }, []);

  const clearFile = useCallback((side: KycSubStep) => {
    if (side === 'recto') {
      if (rectoPreview) URL.revokeObjectURL(rectoPreview);
      setRectoFile(null);
      setRectoPreview(null);
    } else {
      if (versoPreview) URL.revokeObjectURL(versoPreview);
      setVersoFile(null);
      setVersoPreview(null);
    }
  }, [rectoPreview, versoPreview]);

  function handleContinueToVerso() {
    if (!rectoFile) return;
    setSubStep('verso');
    setError('');
  }

  async function handleSubmit() {
    if (!rectoFile || !versoFile) return;
    setLoading(true);
    setError('');
    try {
      const token = (await refreshIfNeeded()) ?? '';
      const [recto, verso] = await Promise.all([
        uploadKycFile(rectoFile, token),
        uploadKycFile(versoFile, token),
      ]);
      await nestFetch(NEST_API.KYC.SUBMIT, {
        method: 'POST',
        token,
        body: JSON.stringify({
          kycDocumentUrl:      recto.url,
          kycDocumentPublicId: recto.publicId,
          kycVersoUrl:         verso.url,
          kycVersoPublicId:    verso.publicId,
        }),
      });
      setGateStatus({ statutKyc: 'EN_ATTENTE' });
      onDone();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Erreur lors de l\'envoi des documents');
    } finally {
      setLoading(false);
    }
  }

  const currentFile = subStep === 'recto' ? rectoFile : versoFile;
  const currentPreview = subStep === 'recto' ? rectoPreview : versoPreview;
  const currentRef = subStep === 'recto' ? rectoRef : versoRef;

  return (
    <div className="space-y-4">

      {/* ── Mini-stepper recto/verso ─────────────────────────────── */}
      <div className="flex items-center justify-center gap-2">
        <StepDot
          label="Recto"
          active={subStep === 'recto'}
          done={subStep === 'verso'}
        />
        <span
          aria-hidden="true"
          className={cn(
            'h-0.5 w-8 rounded-pill transition-all duration-300',
            subStep === 'verso' ? 'bg-forest-600' : 'bg-border',
          )}
        />
        <StepDot
          label="Verso"
          active={subStep === 'verso'}
          done={false}
        />
      </div>

      {/* ── Zone d'upload premium ────────────────────────────────── */}
      <div
        key={subStep}
        className="animate-in fade-in slide-in-from-right-3 duration-300"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">
                {subStep === 'recto' ? 'Face avant (Recto)' : 'Face arrière (Verso)'}
              </p>
              <p className="text-[10px] text-foreground-muted">
                {subStep === 'recto'
                  ? 'Le côté avec votre photo et vos informations'
                  : 'Le côté opposé de votre document'}
              </p>
            </div>
          </div>

          {/* Upload zone */}
          <div
            className={cn(
              'relative rounded-card border-2 border-dashed transition-all overflow-hidden',
              currentFile
                ? 'border-forest-600 bg-forest-50/30'
                : 'border-border bg-background-alt hover:border-forest-400 hover:bg-forest-50/10',
            )}
          >
            {currentPreview ? (
              /* ── Preview de l'image ── */
              <div className="relative aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentPreview}
                  alt={`Aperçu ${subStep}`}
                  className="h-full w-full object-cover"
                />
                {/* Overlay de succès */}
                <div className="absolute inset-0 bg-forest-950/40 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 animate-in zoom-in-50 duration-300">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-600 text-neutral-0 shadow-lg">
                      <CheckCircle2 className="h-6 w-6" />
                    </span>
                    <span className="text-xs font-bold text-neutral-0 bg-forest-950/60 px-3 py-1 rounded-pill">
                      {currentFile?.name ?? 'Fichier sélectionné'}
                    </span>
                  </div>
                </div>

                {/* Bouton supprimer */}
                <button
                  type="button"
                  onClick={() => clearFile(subStep)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-neutral-0/90 border border-border flex items-center justify-center hover:bg-error-50 hover:border-error-200 text-foreground-muted hover:text-error-600 transition-colors cursor-pointer shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* ── Zone de drop vide ── */
              <button
                type="button"
                onClick={() => currentRef.current?.click()}
                className="w-full aspect-[16/10] flex flex-col items-center justify-center gap-3 cursor-pointer group"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-inner border-2 border-dashed border-border bg-background-card text-foreground-muted group-hover:border-forest-400 group-hover:text-forest-600 transition-all">
                  {subStep === 'recto' ? (
                    <CreditCard className="h-6 w-6" />
                  ) : (
                    <ImageIcon className="h-6 w-6" />
                  )}
                </span>
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground group-hover:text-forest-700 transition-colors">
                    Cliquez pour sélectionner
                  </p>
                  <p className="text-[10px] text-foreground-muted mt-0.5">
                    ou glissez votre fichier ici
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-pill border border-border bg-background-card px-2.5 py-1 text-[10px] font-semibold text-foreground-muted">
                  <Upload className="h-3 w-3" />
                  JPG, PNG, WebP · Max 5 Mo
                </span>
              </button>
            )}
          </div>

          {/* Consignes visuelles */}
          <div className="flex items-start gap-2 p-2.5 rounded-inner bg-background-alt border border-border">
            <AlertCircle className="h-3.5 w-3.5 text-foreground-muted shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[10px] leading-relaxed text-foreground-muted">
              {subStep === 'recto'
                ? 'Assurez-vous que votre photo, nom et numéro de document sont lisibles. Pas de reflet ni de doigt sur le document.'
                : 'Vérifiez que tous les coins du document sont visibles et que le texte est lisible.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Erreur ──────────────────────────────────────────────── */}
      {error && (
        <p className="text-[11px] font-semibold text-error-600 bg-error-50 border border-error-500/30 rounded-inner px-3 py-2">
          {error}
        </p>
      )}

      {/* ── Bouton d'action ──────────────────────────────────────── */}
      {subStep === 'recto' ? (
        <button
          type="button"
          onClick={handleContinueToVerso}
          disabled={!rectoFile}
          className="btn-action w-full text-xs justify-center cursor-pointer disabled:opacity-40"
        >
          <span>Continuer avec le verso</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !rectoFile || !versoFile}
            className="btn-action w-full text-xs justify-center cursor-pointer disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Soumettre mes pièces d&apos;identité
              </>
            )}
          </button>

          {/* Retour au recto */}
          <button
            type="button"
            onClick={() => { setSubStep('recto'); setError(''); }}
            className="w-full text-center text-[11px] font-semibold text-foreground-muted hover:text-foreground transition-colors cursor-pointer py-1"
          >
            ← Modifier le recto
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={rectoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'recto'); }}
      />
      <input
        ref={versoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], 'verso'); }}
      />
    </div>
  );
}

/* ─── Step dot for mini-stepper ────────────────────────────────────────────── */

function StepDot({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-bold transition-all duration-300',
          done
            ? 'border-forest-600 bg-forest-600 text-neutral-0'
            : active
              ? 'border-forest-600 bg-forest-50 text-forest-700 ring-2 ring-forest-500/15'
              : 'border-border bg-background-alt text-foreground-faint',
        )}
      >
        {done ? (
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <CreditCard className="h-3 w-3" />
        )}
      </span>
      <span
        className={cn(
          'text-[9px] font-bold uppercase tracking-wider transition-colors',
          done ? 'text-forest-700' : active ? 'text-foreground' : 'text-foreground-faint',
        )}
      >
        {label}
      </span>
    </div>
  );
}
