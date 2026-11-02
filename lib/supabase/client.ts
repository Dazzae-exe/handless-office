import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// createBrowserClient es singleton internamente: es seguro llamarlo en cada render.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
