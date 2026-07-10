'use client';

import { useRef, useState } from 'react';
import { Upload, CheckCircle2, X } from 'lucide-react';
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
          label="Recto CNI"
          file={rectoFile}
          inputRef={rectoRef}
          onSelect={setRectoFile}
          onClear={() => setRectoFile(null)}
        />
        <UploadSlot
          label="Verso CNI"
          file={versoFile}
          inputRef={versoRef}
          onSelect={setVersoFile}
          onClear={() => setVersoFile(null)}
        />
      </div>

      <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
        Formats acceptés : JPG, PNG, WebP · Max 5 Mo par fichier
      </p>

      {error && (
        <p className="text-[11px] font-medium text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !rectoFile || !versoFile}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl py-3 transition-colors"
      >
        {loading ? 'Envoi en cours…' : 'Soumettre mes documents'}
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
      <p className="text-xs font-bold text-neutral-600">{label}</p>
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-colors',
          hasFile
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-border bg-neutral-50 hover:border-primary-300 hover:bg-primary-50',
        )}
      >
        <button
          type="button"
          onClick={() => !hasFile && inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-5 px-3"
        >
          {hasFile ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <span className="text-[11px] font-bold text-emerald-700 text-center leading-tight break-all line-clamp-2">
                {file.name}
              </span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-neutral-400" />
              <span className="text-[11px] font-bold text-neutral-400 text-center">
                Choisir
              </span>
            </>
          )}
        </button>

        {hasFile && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-colors"
          >
            <X className="w-2.5 h-2.5 text-neutral-400 hover:text-rose-500" />
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
