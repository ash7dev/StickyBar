import { useRoleStore } from '@/stores/role.store';
import { tokenManager } from './token-manager';

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

/**
 * Fetch wrapper with automatic token management, retry logic, and request queuing
 *
 * Features:
 * - ✅ Automatic token refresh with request queuing
 * - ✅ Retry with exponential backoff (3 attempts)
 * - ✅ Type-safe error handling
 * - ✅ Cross-tab synchronization
 */
export async function nestFetch<T>(
  url: string,
  options: RequestInit & {
    token?: string;
    skipAutoToken?: boolean;
    skipContentType?: boolean;
    preferredRole?: 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN' | null;
    retryAttempts?: number;
  } = {},
): Promise<T> {
  const {
    token,
    skipAutoToken,
    skipContentType,
    preferredRole,
    retryAttempts = 3,
    ...fetchOptions
  } = options;

  const store = useRoleStore.getState();

  // Get valid token (with automatic refresh if needed)
  let activeToken: string | null = null;
  if (token) {
    activeToken = token;
  } else if (!skipAutoToken && store.nestToken) {
    try {
      activeToken = await tokenManager.getValidToken();
    } catch (error) {
      console.warn('[nestFetch] Failed to get valid token:', error);
      // Continue without token (for public endpoints)
    }
  }

  // Use preferredRole if provided, otherwise use store role
  const roleToSend = preferredRole !== undefined ? preferredRole : store.activeRole;

  // Build headers (skipContentType=true for multipart uploads)
  const headers: Record<string, string> = {
    ...(skipContentType ? {} : { 'Content-Type': 'application/json' }),
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    ...(roleToSend ? { 'X-Active-Role': roleToSend } : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  // Retry logic with exponential backoff
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      const res = await fetch(url, { ...fetchOptions, headers });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = extractErrorMessage(data) ?? `Erreur ${res.status}`;
        throw new ApiError(res.status, message, data);
      }

      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      const isLastAttempt = attempt === retryAttempts - 1;
      const isRetryableError =
        error instanceof ApiError &&
        (error.status >= 500 || error.status === 408 || error.status === 429);

      // Don't retry on client errors (4xx except 408/429) or last attempt
      if (!isRetryableError || isLastAttempt) {
        throw lastError;
      }

      // Exponential backoff: 500ms, 1s, 2s
      const delay = 500 * Math.pow(2, attempt);
      console.warn(`[nestFetch] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Request failed after all retry attempts');
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  // NestJS ValidationPipe format
  if (Array.isArray(d.message)) return (d.message as string[]).join(', ');
  if (typeof d.message === 'string') return d.message;
  return null;
}
