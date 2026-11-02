'use client';

import './globals.css';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function GlobalError({ error, unstable_retry }: GlobalErrorProps) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <title>Algo salió mal</title>
        <main className="flex min-h-screen flex-1 items-center justify-center p-6">
          <div role="alert">
            <EmptyState
              icon={AlertTriangle}
              title="Algo salió mal"
              description={
                error.digest
                  ? `Ocurrió un error inesperado. Código: ${error.digest}`
                  : 'Ocurrió un error inesperado.'
              }
              action={<Button onClick={() => unstable_retry()}>Reintentar</Button>}
            />
          </div>
        </main>
      </body>
    </html>
  );
}
