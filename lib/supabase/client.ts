import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types';

/**
 * Cliente Supabase para componentes del lado del cliente ('use client').
 * createBrowserClient usa un patrón singleton internamente, por lo que es
 * seguro llamarlo en cada render.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
