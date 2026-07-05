import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';

/**
 * Layout de la aplicación (rutas protegidas). El proxy ya garantiza sesión, así
 * que aquí sólo leemos el correo para mostrarlo en la barra lateral y montamos
 * el shell (barra lateral + header + footer). Server Component: sólo pasamos el
 * email al cliente, minimizando la serialización.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = (data?.claims?.email as string | undefined) ?? '';

  return <AppShell email={email}>{children}</AppShell>;
}
