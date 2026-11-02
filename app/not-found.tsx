import type { Metadata } from 'next';
import { FileQuestion } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ButtonLink } from '@/components/common/Button';

export const metadata: Metadata = {
  title: 'Página no encontrada',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-6">
      <EmptyState
        icon={FileQuestion}
        title="Página no encontrada"
        description="La página que buscas no existe o fue movida."
        action={<ButtonLink href="/">Volver al inicio</ButtonLink>}
      />
    </main>
  );
}
