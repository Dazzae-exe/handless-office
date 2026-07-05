import Link from 'next/link';
import Image from 'next/image';
import { FolderGit2 } from 'lucide-react';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
}

/**
 * Card de proyecto para el grid: cover arriba, título con badge de estado,
 * descripción y tags. Una sola superficie que enlaza a la edición.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <li>
      <Link
        href={`/projects/${project.id}`}
        className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {project.cover_image ? (
          <div className="relative aspect-video w-full border-b border-border">
            <Image
              src={project.cover_image}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center border-b border-border bg-surface-hover">
            <FolderGit2 className="h-6 w-6 text-muted" strokeWidth={1.5} />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-medium text-foreground">{project.title}</h3>
            <span
              className={`shrink-0 rounded-card border px-2.5 py-0.5 text-xs font-medium ${
                project.published
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-border bg-surface-hover text-muted'
              }`}
            >
              {project.published ? 'Publicado' : 'Borrador'}
            </span>
          </div>

          {project.description && (
            <p className="line-clamp-2 text-sm text-muted">{project.description}</p>
          )}

          {project.tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-card border border-border bg-background px-2 py-0.5 text-xs text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
