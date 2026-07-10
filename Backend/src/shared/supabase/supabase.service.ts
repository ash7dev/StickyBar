import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly admin: SupabaseClient;
  private readonly anon: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');
    const serviceKey = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    // Client admin (service role) — bypass RLS, gestion utilisateurs
    this.admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Client anon — opérations auth utilisateur (signUp, signIn, OTP)
    this.anon = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  getAdmin(): SupabaseClient {
    return this.admin;
  }

  getAnon(): SupabaseClient {
    return this.anon;
  }
}
