'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Loader2, Settings2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Dialog } from '@/components/common/Dialog';
import { usePosts } from '@/hooks/usePosts';
import { uploadEditorImage, ACCEPTED_IMAGE_TYPES } from '@/lib/supabase/storage';
import {
  normalizeTag,
  slugify,
  validateOptionalUrl,
  validatePostContent,
  validatePostTitle,
  validatePostType,
} from '@/utils/validators/post';
import type { Post, PostFormData } from '@/types/post';

// Tiptap + lowlight + yjs pesan: solo en cliente y en las rutas de edición (bundle-dynamic-imports).
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

// Fuera del componente para que el ref callback sea estable y solo se ejecute al montar.
function resizeTitle(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

interface PostFormProps {
  post?: Post;
  typeOptions: string[];
}

export function PostForm({ post, typeOptions }: PostFormProps) {
  const router = useRouter();
  const { create, update, remove, pending, error } = usePosts();

  const [title, setTitle] = useState(post?.title ?? '');
  const [type, setType] = useState(post?.type ?? '');
  const [description, setDescription] = useState(post?.description ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(post != null);
  const [githubUrl, setGithubUrl] = useState(post?.github_url ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(post?.website_url ?? '');
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? null);
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [published, setPublished] = useState(post?.published ?? false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // En un ref y no en estado: cambia en cada tecla y re-renderizar el formulario al escribir sería caro.
  const contentRef = useRef(post?.content ?? '');
  // Valor inicial estable para el editor controlado (no se resetea al tipear).
  const [initialContent] = useState(post?.content ?? '');

  const effectiveSlug = slugTouched ? slug : slugify(title);

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag) return;
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
    setTagInput('');
  };

  const save = async (nextPublished: boolean = published) => {
    const validationError =
      validatePostTitle(title) ??
      validatePostType(type) ??
      validatePostContent(contentRef.current) ??
      validateOptionalUrl(githubUrl.trim()) ??
      validateOptionalUrl(websiteUrl.trim());
    setFormError(validationError);
    if (validationError) return;

    const pendingTag = normalizeTag(tagInput);
    const data: PostFormData = {
      type: type.trim(),
      title: title.trim(),
      content: contentRef.current,
      description: description.trim() || null,
      slug: effectiveSlug || null,
      cover_image: coverImage,
      tags: pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags,
      github_url: githubUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
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
      const { url } = await uploadEditorImage(file);
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
        ref={resizeTitle}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          resizeTitle(e.currentTarget);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
        rows={1}
        placeholder="Título del post"
        aria-label="Título del post"
        className="w-full resize-none overflow-hidden bg-transparent text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted/50"
      />

      <Input
        label="Tipo"
        list="post-type-options"
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="blog, proyecto…"
        aria-invalid={formError !== null && formError === validatePostType(type)}
      />
      <datalist id="post-type-options">
        {typeOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <TiptapEditor
        value={initialContent}
        onChange={(html) => {
          contentRef.current = html;
        }}
      />

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Ajustes del post"
        description="Metadatos, enlaces y opciones de publicación."
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
            <label htmlFor="post-description" className="text-sm font-medium text-foreground">
              Descripción
            </label>
            <textarea
              id="post-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Resumen corto para el listado…"
              className="w-full resize-none rounded-card border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          <Input
            label="GitHub"
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/usuario/repo"
          />

          <Input
            label="Sitio web"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://mi-proyecto.vercel.app"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="post-tags" className="text-sm font-medium text-foreground">
              Tags
            </label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-card border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      aria-label={`Quitar tag ${tag}`}
                      className="text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              id="post-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(tagInput);
                } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
                  setTags((prev) => prev.slice(0, -1));
                }
              }}
              onBlur={() => addTag(tagInput)}
              placeholder="Escribe un tag y presiona Enter…"
              className="h-10 w-full rounded-card border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
