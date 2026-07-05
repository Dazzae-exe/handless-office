import type { Metadata } from 'next';
import { ProjectForm } from '@/components/projects/ProjectForm';

export const metadata: Metadata = { title: 'Nuevo proyecto' };

/** Página de creación: monta el formulario Notion-style vacío. */
export default function NewProjectPage() {
  return <ProjectForm />;
}
