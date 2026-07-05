'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import DragHandle from '@tiptap/extension-drag-handle-react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  GripVertical,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  TextQuote,
  ImagePlus,
  Loader2,
} from 'lucide-react';

import { SlashCommand } from '@/components/editor/extensions/slash-command';
import { uploadEditorImage } from '@/lib/supabase/storage';
import type { EditorContentType } from '@/lib/supabase/storage';
import './editor.css';

const lowlight = createLowlight(common);

export interface TiptapEditorProps {
  /** Contenido HTML controlado. */
  value: string;
  /** Se dispara con el HTML actualizado en cada cambio. */
  onChange: (html: string) => void;
  /**
   * Tipo de contenido: define la carpeta del Storage donde se suben las
   * imágenes (`posts/` para blogs, `projects/` para proyectos).
   */
  contentType: EditorContentType;
  /** Texto del placeholder cuando el editor está vacío. */
  placeholder?: string;
  /** Deshabilita toda edición (solo lectura permanente). */
  disabled?: boolean;
  className?: string;
}

type Mode = 'edit' | 'preview';

export function TiptapEditor({
  value,
  onChange,
  contentType,
  placeholder = "Escribe '/' para comandos…",
  disabled = false,
  className = '',
}: TiptapEditorProps) {
  const [mode, setMode] = useState<Mode>('edit');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInputId = useId();

  const editable = !disabled && mode === 'edit';

  // Referencia estable para insertar imágenes desde handlers de PM (paste/drop),
  // evitando closures obsoletos sobre `editor`.
  const insertImageRef = useRef<(file: File) => void>(() => {});
  const requestImageUpload = useCallback(() => {
    (document.getElementById(imageInputId) as HTMLInputElement | null)?.click();
  }, [imageInputId]);

  const editor = useEditor({
    // Requerido en frameworks SSR (Next.js) para evitar mismatch de hidratación.
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        // Usamos CodeBlockLowlight en su lugar (resaltado de sintaxis).
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            class: 'tiptap-link',
            rel: 'noopener noreferrer nofollow',
            target: '_blank',
          },
        },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: 'tiptap-image' },
      }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading' ? 'Encabezado' : placeholder,
      }),
      CharacterCount,
      SlashCommand.configure({ requestImageUpload }),
    ],
    content: value,
    editorProps: {
      attributes: { class: 'tiptap-editor focus:outline-none' },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith('image/')
        );
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((f) => insertImageRef.current(f));
        return true;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(
          (event as DragEvent).dataTransfer?.files ?? []
        ).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((f) => insertImageRef.current(f));
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Estado derivado reactivo (v3 no re-renderiza por transacción por defecto).
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            words: editor.storage.characterCount.words(),
            characters: editor.storage.characterCount.characters(),
            isBold: editor.isActive('bold'),
            isItalic: editor.isActive('italic'),
            isUnderline: editor.isActive('underline'),
            isStrike: editor.isActive('strike'),
            isCode: editor.isActive('code'),
            isLink: editor.isActive('link'),
            isH1: editor.isActive('heading', { level: 1 }),
            isH2: editor.isActive('heading', { level: 2 }),
            isQuote: editor.isActive('blockquote'),
          }
        : null,
  });

  const insertImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setError(null);
      setUploading(true);
      try {
        const { url } = await uploadEditorImage(file, contentType);
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
      } finally {
        setUploading(false);
      }
    },
    [editor, contentType]
  );
  // Mantén la referencia de subida al día para los handlers de PM (paste/drop).
  useEffect(() => {
    insertImageRef.current = insertImage;
  }, [insertImage]);

  // Sincroniza el modo edición/preview con el estado editable del editor.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Refleja cambios externos de `value` sin romper el cursor ni re-emitir.
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) insertImage(file);
    e.target.value = ''; // permite volver a subir el mismo archivo
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Barra de modo: alterna edición / vista de lectura + contador. */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-card border border-border bg-surface p-0.5 text-sm">
          {(['edit', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-[8px] px-3 py-1 font-medium transition-colors ${
                mode === m
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {m === 'edit' ? 'Editar' : 'Vista previa'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          {uploading && (
            <span className="inline-flex items-center gap-1.5 text-accent">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Subiendo…
            </span>
          )}
          {state && (
            <span>
              {state.words} palabras · {state.characters} caracteres
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-card border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div
        className={`relative rounded-card border border-border bg-surface px-4 py-3 ${
          mode === 'preview' ? 'is-preview' : ''
        }`}
      >
        {editor && editable && (
          <>
            <DragHandle editor={editor}>
              <div className="tiptap-drag-handle" aria-hidden>
                <GripVertical className="h-4 w-4" />
              </div>
            </DragHandle>

            <BubbleMenu
              editor={editor}
              shouldShow={({ editor, state }) =>
                editor.isEditable &&
                !state.selection.empty &&
                !editor.isActive('image') &&
                !editor.isActive('codeBlock')
              }
            >
              <div className="flex items-center gap-0.5 rounded-card border border-border bg-surface p-1 shadow-xl">
                <BubbleButton
                  active={state?.isBold}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  label="Negrita"
                >
                  <Bold className="h-4 w-4" />
                </BubbleButton>
                <BubbleButton
                  active={state?.isItalic}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  label="Cursiva"
                >
                  <Italic className="h-4 w-4" />
                </BubbleButton>
                <BubbleButton
                  active={state?.isUnderline}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  label="Subrayado"
                >
                  <Underline className="h-4 w-4" />
                </BubbleButton>
                <BubbleButton
                  active={state?.isStrike}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  label="Tachado"
                >
                  <Strikethrough className="h-4 w-4" />
                </BubbleButton>
                <BubbleButton
                  active={state?.isCode}
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  label="Código en línea"
                >
                  <Code className="h-4 w-4" />
                </BubbleButton>
                <BubbleButton active={state?.isLink} onClick={setLink} label="Enlace">
                  <LinkIcon className="h-4 w-4" />
                </BubbleButton>
                <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
                <BubbleButton
                  active={state?.isH1}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  label="Encabezado 1"
                >
                  <Heading1 className="h-4 w-4" />
                </BubbleButton>
                <BubbleButton
                  active={state?.isH2}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  label="Encabezado 2"
                >
                  <Heading2 className="h-4 w-4" />
                </BubbleButton>
                <BubbleButton
                  active={state?.isQuote}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  label="Cita"
                >
                  <TextQuote className="h-4 w-4" />
                </BubbleButton>
                <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
                <BubbleButton onClick={requestImageUpload} label="Imagen">
                  <ImagePlus className="h-4 w-4" />
                </BubbleButton>
              </div>
            </BubbleMenu>
          </>
        )}

        <EditorContent editor={editor} />
      </div>

      <input
        id={imageInputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileInputChange}
      />
    </div>
  );
}

function BubbleButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors ${
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted hover:bg-surface-hover hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
