import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/types';

/** Rutas accesibles sin sesión iniciada. */
const PUBLIC_ROUTES = ['/login', '/signup', '/auth', '/auth-code-error'];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Refresca la sesión de Supabase en cada request y aplica la protección de
 * rutas. Se ejecuta desde el proxy (middleware) de Next.js.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Con Fluid Compute, crear un cliente nuevo en cada request (nunca global).
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no ejecutar código entre createServerClient y getClaims().
  // getClaims() valida la firma del JWT contra las llaves públicas del proyecto,
  // por eso es seguro confiar en él para proteger rutas (a diferencia de
  // getSession(), que no revalida el token).
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const pathname = request.nextUrl.pathname;

  // Sin sesión en una ruta protegida → al login.
  if (!claims && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // Con sesión en login/signup → al dashboard.
  if (claims && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // IMPORTANTE: devolver supabaseResponse tal cual para no desincronizar las
  // cookies entre navegador y servidor.
  return supabaseResponse;
}
