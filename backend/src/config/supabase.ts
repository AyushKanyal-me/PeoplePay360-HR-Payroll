import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Anonymous public Supabase client.
 * Respects RLS and uses the public anon key.
 */
export const supabaseAnonClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Privileged Service-Role Supabase client.
 * Bypasses RLS. NEVER expose to frontend or client context.
 * Used exclusively for backend administrative tasks (user provisioning, background jobs).
 */
export const supabaseAdminClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Creates a scoped Supabase client authenticated on behalf of a specific user token.
 * This client respects RLS using the user's JWT claims.
 */
export function createScopedClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
