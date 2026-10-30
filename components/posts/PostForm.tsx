'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Loader2, Settings2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Dialog } from '@/components/common/Dialog';
import { usePosts } from '@/lib/hooks/usePosts';
import { uploadEditorImage, ACCEPTED_IMAGE_TYPES } from '@/lib/supabase/storage';
import { slugify, validatePostContent, validatePostTitle } from '@/utils/validators/post';
import type { Post } from '@/types/types';

// El editor arrastra Tiptap + lowlight + yjs: se carga solo en cliente y solo
// en las rutas de edición (bundle-dynamic-imports). Sin SSR porque Tiptap ya
// renderiza con `immediatelyRender: false`.
const TiptapEditor = dynamic(
  () => import('@/components/editor/TiptapEditor').then((m) => m.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center text-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-label="Cargando editor…" />
      </div>
    ),
  }
);

interface PostFormProps {
  /** Post existente para editar; omitir para crear uno nuevo. */
  post?: Post;
}

/**
 * Página de escritura estilo Notion: título gigante + editor a ancho completo.
 * Los metadatos (slug, excerpt, cover, destacado) viven en el diálogo Ajustes
 * para no ensuciar la vista de escritura.
 */
export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const { create, update, remove, pending, error } = usePosts();

  const [title, setTitle] = useState(post?.title ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  // Al editar, el slug guardado manda; al crear, se deriva del título hasta
  // que el usuario lo toque (estado derivado, sin efectos).
  const [slugTouched, setSlugTouched] = useState(post != null);
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? null);
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [published, setPublished] = useState(post?.published ?? false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // El HTML del editor vive en un ref: cambia en cada tecla y solo se lee al
  // guardar, así el formulario no se re-renderiza mientras se escribe.
  const contentRef = useRef(post?.content ?? '');
  // Valor inicial estable para el editor controlado (no se resetea al tipear).
  const [initialContent] = useState(post?.content ?? '');

  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-alto del título (multilínea como Notion, sin scrollbar interno).
  const resizeTitle = () => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(resizeTitle, []);

  const effectiveSlug = slugTouched ? slug : slugify(title);

  const save = async (nextPublished: boolean = published) => {
    const validationError = validatePostTitle(title) ?? validatePostContent(contentRef.current);
    setFormError(validationError);
    if (validationError) return;

    const data = {
      title: title.trim(),
      content: contentRef.current,
      excerpt: excerpt.trim() || null,
      slug: effectiveSlug || null,
      cover_image: coverImage,
      published: nextPublished,
      featured,
    };

    if (post) {
      const updated = await update(post.id, data);
      if (updated) setPublished(updated.published);
    } else {
      const created = await create(data);
      if (created) router.replace(`/posts/${created.id}`);
    }
  };

  const onDelete = async () => {
    if (!post) return;
    const ok = await remove(post.id);
    if (ok) router.replace('/posts');
    else setConfirmDelete(false);
  };

  const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFormError(null);
    setUploadingCover(true);
    try {
      const { url } = await uploadEditorImage(file, 'posts');
      setCoverImage(url);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo subir la portada.');
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          Posts
        </Link>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-card border px-2.5 py-0.5 text-xs font-medium ${
              published
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-border bg-surface-hover text-muted'
            }`}
          >
            {published ? 'Publicado' : 'Borrador'}
          </span>
          <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="h-4 w-4" />
            Ajustes
          </Button>
          {published ? (
            <Button onClick={() => save()} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => save(false)} disabled={pending}>
                Guardar borrador
              </Button>
              <Button onClick={() => save(true)} disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Publicar
              </Button>
            </>
          )}
        </div>
      </div>

      {(formError ?? error) && (
        <p role="alert" className="text-sm text-danger">
          {formError ?? error}
        </p>
      )}

      {coverImage && (
        <div className="relative aspect-[3/1] w-full overflow-hidden rounded-card border border-border">
          <Image
            src={coverImage}
            alt="Imagen de portada"
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => setCoverImage(null)}
            aria-label="Quitar portada"
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          resizeTitle();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
        rows={1}
        placeholder="Título del post"
        aria-label="Título del post"
        className="w-full resize-none overflow-hidden bg-transparent text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted/50"
      />

      <TiptapEditor
        value={initialContent}
        onChange={(html) => {
          contentRef.current = html;
        }}
        contentType="posts"
      />

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Ajustes del post"
        description="Metadatos y opciones de publicación."
        footer={
          <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
            Listo
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            onBlur={() => setSlug((s) => slugify(s))}
            placeholder="se-genera-del-titulo"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="post-excerpt" className="text-sm font-medium text-foreground">
              Excerpt
            </label>
            <textarea
              id="post-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Resumen corto para el listado…"
              className="w-full resize-none rounded-card border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Imagen de portada</span>
            <label className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-card border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover">
              {uploadingCover ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {coverImage ? 'Cambiar portada' : 'Subir portada'}
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                onChange={onCoverChange}
                disabled={uploadingCover}
                className="sr-only"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Destacado
          </label>

          {post && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              {published && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSettingsOpen(false);
                    save(false);
                  }}
                  disabled={pending}
                >
                  Despublicar
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setSettingsOpen(false);
                  setConfirmDelete(true);
                }}
                className="text-danger hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar post
              </Button>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="¿Eliminar este post?"
        description="Esta acción es permanente y no se puede deshacer."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              onClick={onDelete}
              disabled={pending}
              className="border-transparent bg-danger text-white hover:bg-danger/90"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </>
        }
      />
    </div>
  );
}
