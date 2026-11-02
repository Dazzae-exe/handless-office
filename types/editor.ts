import type { LucideIcon } from 'lucide-react';
import type { Editor, Range } from '@tiptap/core';

export type EditorContentType = 'posts' | 'projects';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: LucideIcon;
  keywords?: string[];
  command: (opts: { editor: Editor; range: Range }) => void;
}
