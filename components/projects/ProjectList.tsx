import { ProjectCard } from '@/components/projects/ProjectCard';
import type { Project } from '@/types/types';

interface ProjectListProps {
  projects: Project[];
}

/**
 * Grid presentacional de proyectos. El filtrado, la búsqueda, el tag activo y
 * la paginación se resuelven en el servidor a partir de la URL.
 */
export function ProjectList({ projects }: ProjectListProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </ul>
  );
}
