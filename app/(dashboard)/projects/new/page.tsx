import type { Metadata } from 'next';
import { ProjectForm } from '@/components/projects/ProjectForm';

export const metadata: Metadata = { title: 'Nuevo proyecto' };

export default function NewProjectPage() {
  return <ProjectForm />;
}
