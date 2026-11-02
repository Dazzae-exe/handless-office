import type { Metadata } from 'next';
import { FileQuestion } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ButtonLink } from '@/components/common/Button';

export const metadata: Metadata = {
  title: 'Contenido no encontrado',
};

export default function DashboardNotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Contenido no encontrado"
      description="El elemento que buscas no existe o fue eliminado."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink href="/">Volver al inicio</ButtonLink>
          <ButtonLink href="/posts" variant="secondary">
            Ver posts
          </ButtonLink>
        </div>
      }
    />
  );
}
