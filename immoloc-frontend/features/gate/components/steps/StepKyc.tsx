'use client';

import { useRef, useState } from 'react';
import { Upload, CheckCircle2, X, Loader2 } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { cn } from '@/lib/utils/cn';

interface Props { onDone: () => void }

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
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit() {
    if (!rectoFile || !versoFile) return;
    setLoading(true); setError('');
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <UploadSlot
          label="Recto CNI / Passeport"
          file={rectoFile}
          inputRef={rectoRef}
          onSelect={setRectoFile}
          onClear={() => setRectoFile(null)}
        />
        <UploadSlot
          label="Verso CNI / Passeport"
          file={versoFile}
          inputRef={versoRef}
          onSelect={setVersoFile}
          onClear={() => setVersoFile(null)}
        />
      </div>

      <p className="text-[11px] text-foreground-muted text-center leading-relaxed font-medium">
        Formats acceptés : JPG, PNG, WebP · Max 5 Mo par fichier
      </p>

      {error && (
        <p className="text-[11px] font-semibold text-error-600 bg-error-50 border border-error-500/30 rounded-inner px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !rectoFile || !versoFile}
        className="btn-action w-full text-xs justify-center cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
        ) : (
          'Soumettre mes pièces d\'identité'
        )}
      </button>
    </div>
  );
}

/* ─── Upload slot ─────────────────────────────────────────────────────────── */

function UploadSlot({
  label,
  file,
  inputRef,
  onSelect,
  onClear,
}: {
  label: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (f: File) => void;
  onClear: () => void;
}) {
  const hasFile = file !== null;

  return (
    <div className="space-y-1.5">
      <p className="eyebrow block">{label}</p>
      <div
        className={cn(
          'relative rounded-field border-2 border-dashed transition-all',
          hasFile
            ? 'border-forest-600 bg-forest-50/40 dark:bg-forest-950/60'
            : 'border-border bg-background-alt hover:border-forest-600 hover:bg-background-card',
        )}
      >
        <button
          type="button"
          onClick={() => !hasFile && inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-5 px-3 cursor-pointer"
        >
          {hasFile ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-forest-600 dark:text-on-inverse-marker shrink-0" />
              <span className="text-[11px] font-bold text-foreground text-center leading-tight break-all line-clamp-2">
                {file.name}
              </span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-foreground-muted" />
              <span className="text-[11px] font-bold text-foreground-muted text-center">
                Choisir un fichier
              </span>
            </>
          )}
        </button>

        {hasFile && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-background-card border border-border flex items-center justify-center hover:bg-error-50 hover:border-error-200 text-foreground-muted hover:text-error-600 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onSelect(e.target.files[0]); }}
      />
    </div>
  );
}
