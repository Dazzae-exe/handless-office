import { Extension } from '@tiptap/core';
import type { Editor, Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionOptions } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  TextQuote,
  Code2,
  Minus,
  Image as ImageIcon,
  Type,
} from 'lucide-react';

import { SlashCommandMenu } from '@/components/editor/SlashCommandMenu';
import type {
  SlashCommandMenuRef,
  SlashCommandMenuProps,
} from '@/components/editor/SlashCommandMenu';
import type { SlashCommandItem } from '@/types/editor';

export interface SlashCommandOptions {
  requestImageUpload: () => void;
}

function buildItems(options: SlashCommandOptions): SlashCommandItem[] {
  return [
    {
      title: 'Texto',
      description: 'Párrafo simple.',
      icon: Type,
      keywords: ['parrafo', 'paragraph', 'text', 'plain'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: 'Encabezado 1',
      description: 'Título de sección grande.',
      icon: Heading1,
      keywords: ['h1', 'titulo', 'heading'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
    },
    {
      title: 'Encabezado 2',
      description: 'Título de sección mediano.',
      icon: Heading2,
      keywords: ['h2', 'subtitulo', 'heading'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    },
    {
      title: 'Encabezado 3',
      description: 'Título de sección pequeño.',
      icon: Heading3,
      keywords: ['h3', 'heading'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
    },
    {
      title: 'Lista con viñetas',
      description: 'Lista simple sin orden.',
      icon: List,
      keywords: ['bullet', 'unordered', 'ul', 'vinetas'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: 'Lista numerada',
      description: 'Lista con orden numérico.',
      icon: ListOrdered,
      keywords: ['ordered', 'ol', 'numero'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: 'Lista de tareas',
      description: 'Casillas marcables.',
      icon: ListTodo,
      keywords: ['todo', 'task', 'checkbox', 'tarea'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
      title: 'Cita',
      description: 'Bloque de cita destacado.',
      icon: TextQuote,
      keywords: ['quote', 'blockquote', 'cita'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: 'Código',
      description: 'Bloque de código con resaltado.',
      icon: Code2,
      keywords: ['code', 'codigo', 'pre', 'snippet'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: 'Divisor',
      description: 'Separador horizontal.',
      icon: Minus,
      keywords: ['divider', 'hr', 'separador', 'rule'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: 'Imagen',
      description: 'Sube una imagen desde tu equipo.',
      icon: ImageIcon,
      keywords: ['image', 'imagen', 'foto', 'picture', 'upload'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        options.requestImageUpload();
      },
    },
  ];
}

function filterItems(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [item.title, ...(item.keywords ?? [])].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

type SlashRenderer = NonNullable<SuggestionOptions<SlashCommandItem>['render']>;

const renderSlashMenu: SlashRenderer = () => {
  let component: ReactRenderer<SlashCommandMenuRef, SlashCommandMenuProps>;
  let unmount: (() => void) | undefined;

  return {
    onStart: (props) => {
      component = new ReactRenderer(SlashCommandMenu, { props, editor: props.editor });
      // La API v3 monta y posiciona el popup con floating-ui internamente.
      unmount = props.mount(component.element);
    },
    onUpdate: (props) => {
      component.updateProps(props);
    },
    onKeyDown: (props) => {
      if (props.event.key === 'Escape') {
        unmount?.();
        return true;
      }
      return component.ref?.onKeyDown(props) ?? false;
    },
    onExit: () => {
      unmount?.();
      component.destroy();
    },
  };
};

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      requestImageUpload: () => {},
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: '/',
        // allowedPrefixes por defecto ([' ']): el "/" solo dispara al inicio del bloque o tras un espacio, como Notion.
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }) => filterItems(buildItems(options), query),
        command: ({ editor, range, props }) => {
          props.command({ editor, range } as { editor: Editor; range: Range });
        },
        render: renderSlashMenu,
      }),
    ];
  },
});
