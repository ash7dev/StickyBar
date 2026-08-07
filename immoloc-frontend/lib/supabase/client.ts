import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        isSingleton: true,
        auth: {
          lock: async (name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
            if (typeof navigator !== 'undefined' && 'locks' in navigator) {
              try {
                return await navigator.locks.request(name, fn);
              } catch (e) {
                // Fallback gracefully if lock was stolen or failed
                return await fn();
              }
            }
            return await fn();
          },
        },
      }
    );
  }

  return client;
}

