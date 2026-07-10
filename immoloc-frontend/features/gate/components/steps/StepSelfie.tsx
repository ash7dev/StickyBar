'use client';

import { useRef, useState, useEffect } from 'react';
import { Camera, CheckCircle2, RotateCw, X } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { cn } from '@/lib/utils/cn';

interface Props {
  onDone: () => void;
}

async function uploadSelfie(file: File, token: string): Promise<{
  url: string;
  publicId: string;
  faceDetected: boolean;
  matchScore?: number;
}> {
  const form = new FormData();
  form.append('file', file);
  return nestFetch(NEST_API.UPLOAD.KYC_SELFIE, {
    method: 'POST',
    token,
    body: form,
    skipContentType: true,
  });
}

export function StepSelfie({ onDone }: Props) {
  const { setGateStatus } = useRoleStore();
  const { refreshIfNeeded } = useNestToken();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Démarrer la caméra
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  async function startCamera() {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Erreur caméra:', err);
      setCameraError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès dans les paramètres.');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedImage(url);
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  }

  function retakePhoto() {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setError('');
    startCamera();
  }

  function toggleCamera() {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }

  async function handleSubmit() {
    if (!capturedImage) return;

    setLoading(true);
    setError('');

    try {
      const token = (await refreshIfNeeded()) ?? '';

      // Convert data URL to File
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

      // Upload selfie
      const result = await uploadSelfie(file, token);

      if (!result.faceDetected) {
        setError('Aucun visage détecté. Veuillez reprendre la photo en vous assurant que votre visage est bien visible.');
        retakePhoto();
        return;
      }

      // Submit KYC selfie
      await nestFetch(NEST_API.KYC.SUBMIT_SELFIE, {
        method: 'POST',
        token,
        body: JSON.stringify({
          kycSelfieUrl: result.url,
          kycSelfiePublicId: result.publicId,
          selfieFaceDetected: result.faceDetected,
          selfieMatchScore: result.matchScore,
        }),
      });

      setGateStatus({ statutKyc: 'VERIFIE' });
      onDone();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Erreur lors de l\'envoi du selfie');
      retakePhoto();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Camera preview or captured image */}
      <div className="relative aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden">
        {capturedImage ? (
          // Captured image preview
          <img
            src={capturedImage}
            alt="Selfie capturé"
            className="w-full h-full object-cover"
          />
        ) : (
          // Live camera preview
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[70%] aspect-[3/4] rounded-full border-4 border-white/30 border-dashed" />
            </div>
          </>
        )}

        {/* Camera error */}
        {cameraError && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-neutral-900/90">
            <div className="text-center">
              <Camera className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-sm text-white font-medium">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Toggle camera button (only on live preview) */}
        {!capturedImage && stream && (
          <button
            onClick={toggleCamera}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Changer de caméra"
          >
            <RotateCw className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
        <p className="text-xs font-bold text-primary-900 mb-2">📸 Instructions</p>
        <ul className="text-[11px] text-primary-700 space-y-1 leading-relaxed">
          <li>• Positionnez votre visage dans le cercle</li>
          <li>• Assurez-vous d'avoir un bon éclairage</li>
          <li>• Retirez lunettes, chapeau ou masque</li>
          <li>• Regardez directement la caméra</li>
        </ul>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-error-50 border border-error-100 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-error-700">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        {capturedImage ? (
          <>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                'Vérification en cours…'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Valider le selfie
                </>
              )}
            </button>
            <button
              onClick={retakePhoto}
              disabled={loading}
              className="w-full bg-background-alt hover:bg-neutral-200 disabled:opacity-50 text-foreground text-sm font-medium rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Reprendre la photo
            </button>
          </>
        ) : (
          <button
            onClick={capturePhoto}
            disabled={!stream || !!cameraError}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Prendre la photo
          </button>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
