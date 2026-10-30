import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/types';

/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 * Con Fluid Compute no se debe guardar este cliente en una variable global:
 * hay que crear uno nuevo en cada request porque depende de las cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll fue llamado desde un Server Component. Se puede ignorar
            // si el proxy (middleware) está refrescando las sesiones.
          }
        },
      },
    }
  );
}
