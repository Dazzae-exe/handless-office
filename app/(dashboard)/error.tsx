'use client';

import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function DashboardError({ error, unstable_retry }: ErrorProps) {
  return (
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
  );
}
