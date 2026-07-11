import { useRoleStore } from '@/stores/role.store';
import { NEST_API } from './endpoints';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function nestFetch<T>(
  url: string,
  options: RequestInit & {
    token?: string;
    skipAutoToken?: boolean;
    skipContentType?: boolean;
    preferredRole?: 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN' | null;
  } = {},
): Promise<T> {
  const { token, skipAutoToken, skipContentType, preferredRole, ...fetchOptions } = options;
  const store = useRoleStore.getState();

  // Utiliser le token fourni ou celui du store
  const activeToken = token ?? (!skipAutoToken ? store.nestToken : null);

  // Utiliser preferredRole si fourni, sinon le rôle du store
  const roleToSend = preferredRole !== undefined ? preferredRole : store.activeRole;

  // skipContentType=true pour les uploads multipart (le browser gère le boundary)
  const headers: Record<string, string> = {
    ...(skipContentType ? {} : { 'Content-Type': 'application/json' }),
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    ...(roleToSend ? { 'X-Active-Role': roleToSend } : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  const buildRequest = (h: Record<string, string>) => fetch(url, { ...fetchOptions, headers: h });

  let res = await buildRequest(headers);

  // ── Gestion du Refresh Token (Intercepteur 401) ───────────────────────────
  if (
    res.status === 401 && 
    store.refreshToken && 
    !url.includes('/auth/refresh') && 
    !url.includes('/auth/logout') &&
    !url.includes('/auth/me/supabase')
  ) {
    try {
      const refreshRes = await fetch(NEST_API.AUTH.REFRESH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: store.refreshToken }),
      });

      if (refreshRes.ok) {
        const result = await refreshRes.json();
        // Préserver tous les champs du store pendant le refresh
        store.setSession({
          token: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          role: store.activeRole,
          estProprietaire: store.estProprietaire,
          userId: store.userId ?? '',
          hasAnnonce: store.hasAnnonce,
          profileCompleted: store.profileCompleted,
          phoneVerified: store.phoneVerified,
          statutKyc: store.statutKyc,
          dateNaissance: store.dateNaissance,
          selfieFaceDetected: store.selfieFaceDetected,
          selfieMatchScore: store.selfieMatchScore,
        });

        const retryHeaders = { ...headers, Authorization: `Bearer ${result.accessToken}` };
        res = await buildRequest(retryHeaders);
      } else {
        // Le refresh a échoué (ex: refresh token expiré), on déconnecte
        store.clearSession();
      }
    } catch (e) {
      store.clearSession();
    }
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = extractErrorMessage(data) ?? `Erreur ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  // NestJS ValidationPipe format
  if (Array.isArray(d.message)) return (d.message as string[]).join(', ');
  if (typeof d.message === 'string') return d.message;
  return null;
}
