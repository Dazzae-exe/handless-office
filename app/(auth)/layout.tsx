import type { ReactNode } from 'react';

/**
 * Layout exclusivo para las pantallas de autenticación, separado del layout de
 * la aplicación. Centra una sola tarjeta minimalista sobre el fondo del tema.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-card bg-accent text-base font-semibold text-accent-foreground">
            B
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Blog Dashboard
          </h1>
        </div>
        {children}
      </div>
    </main>
  );
}
