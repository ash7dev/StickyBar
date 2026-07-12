/**
 * Token Manager - Gestion centralisée et thread-safe du refresh token
 *
 * Features:
 * - ✅ Request queuing pendant le refresh (évite les races)
 * - ✅ Singleton pattern (un seul refresh à la fois)
 * - ✅ Cross-tab synchronization via BroadcastChannel
 * - ✅ Retry avec exponential backoff
 * - ✅ Type-safe & testable
 */

import { useRoleStore } from '@/stores/role.store';
import { NEST_API } from './endpoints';

type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

class TokenManager {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  private requestQueue: QueuedRequest[] = [];
  private refreshAttempts = 0;
  private readonly MAX_REFRESH_ATTEMPTS = 3;
  private readonly REFRESH_BACKOFF_MS = 1000;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    // Initialize cross-tab synchronization
    this.initCrossTabSync();
  }

  /**
   * Initialize BroadcastChannel for cross-tab token synchronization
   */
  private initCrossTabSync() {
    if (typeof window === 'undefined') return;

    try {
      this.broadcastChannel = new BroadcastChannel('immoloc-auth');

      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'TOKEN_REFRESHED':
            // Another tab refreshed the token, update local store
            const store = useRoleStore.getState();
            store.setSession({
              token: payload.accessToken,
              refreshToken: payload.refreshToken,
              expiresIn: payload.expiresIn,
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
            break;

          case 'LOGOUT':
            // Another tab logged out, sync logout
            useRoleStore.getState().clearSession();
            break;

          case 'ROLE_CHANGED':
            // Another tab changed role, sync role
            useRoleStore.getState().setRole(payload.role);
            break;
        }
      };
    } catch (error) {
      console.warn('[TokenManager] BroadcastChannel not supported:', error);
    }
  }

  /**
   * Broadcast token refresh to other tabs
   */
  private broadcastTokenRefresh(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) {
    try {
      this.broadcastChannel?.postMessage({
        type: 'TOKEN_REFRESHED',
        payload: tokens,
      });
    } catch (error) {
      console.warn('[TokenManager] Failed to broadcast token refresh:', error);
    }
  }

  /**
   * Broadcast logout to other tabs
   */
  public broadcastLogout() {
    try {
      this.broadcastChannel?.postMessage({ type: 'LOGOUT' });
    } catch (error) {
      console.warn('[TokenManager] Failed to broadcast logout:', error);
    }
  }

  /**
   * Broadcast role change to other tabs
   */
  public broadcastRoleChange(role: string) {
    try {
      this.broadcastChannel?.postMessage({
        type: 'ROLE_CHANGED',
        payload: { role },
      });
    } catch (error) {
      console.warn('[TokenManager] Failed to broadcast role change:', error);
    }
  }

  /**
   * Get valid token (refresh if needed, queue concurrent requests)
   *
   * @returns Promise<string> - Valid access token
   * @throws Error if refresh fails after MAX_REFRESH_ATTEMPTS
   */
  async getValidToken(): Promise<string> {
    const store = useRoleStore.getState();

    // If token is still valid, return it
    if (store.nestToken && store.tokenExpiresAt && Date.now() < store.tokenExpiresAt - 60000) {
      return store.nestToken;
    }

    // If already refreshing, queue this request
    if (this.isRefreshing && this.refreshPromise) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject });
      });
    }

    // Start refresh process
    return this.refreshToken();
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshToken(): Promise<string> {
    const store = useRoleStore.getState();

    if (!store.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const newToken = await this.refreshPromise;

      // Resolve all queued requests
      this.requestQueue.forEach(({ resolve }) => resolve(newToken));
      this.requestQueue = [];
      this.refreshAttempts = 0;

      return newToken;
    } catch (error) {
      // Reject all queued requests
      const err = error instanceof Error ? error : new Error('Token refresh failed');
      this.requestQueue.forEach(({ reject }) => reject(err));
      this.requestQueue = [];

      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual refresh HTTP call with retry logic
   */
  private async performRefresh(): Promise<string> {
    const store = useRoleStore.getState();

    for (let attempt = 0; attempt < this.MAX_REFRESH_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(NEST_API.AUTH.REFRESH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: store.refreshToken }),
        });

        if (!response.ok) {
          // Refresh token expired or invalid
          if (response.status === 401 || response.status === 403) {
            console.warn('[TokenManager] Refresh token invalid/expired, clearing session');
            store.clearSession();
            this.broadcastLogout();
            throw new Error('Refresh token expired');
          }

          throw new Error(`Refresh failed with status ${response.status}`);
        }

        const result = await response.json();

        // Update store with new tokens
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

        // Broadcast to other tabs
        this.broadcastTokenRefresh({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        });

        console.log('[TokenManager] ✅ Token refreshed successfully');
        return result.accessToken;
      } catch (error) {
        const isLastAttempt = attempt === this.MAX_REFRESH_ATTEMPTS - 1;

        if (isLastAttempt) {
          console.error('[TokenManager] ❌ Token refresh failed after max attempts:', error);
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = this.REFRESH_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(`[TokenManager] ⚠️  Refresh attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Token refresh failed after all attempts');
  }

  /**
   * Clear all state and queued requests (for logout)
   */
  public clear() {
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.requestQueue.forEach(({ reject }) =>
      reject(new Error('Session cleared'))
    );
    this.requestQueue = [];
    this.refreshAttempts = 0;
  }

  /**
   * Cleanup resources
   */
  public destroy() {
    this.clear();
    this.broadcastChannel?.close();
    this.broadcastChannel = null;
  }
}

// Singleton instance
export const tokenManager = new TokenManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    tokenManager.destroy();
  });
}
