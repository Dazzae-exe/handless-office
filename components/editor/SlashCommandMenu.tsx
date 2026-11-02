'use client';

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { SlashCommandItem } from '@/types/editor';

export interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashCommandMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Al cambiar el filtro, la lista se reordena: vuelve al primer resultado.
    const [prevItems, setPrevItems] = useState(items);
    if (items !== prevItems) {
      setPrevItems(items);
      setSelectedIndex(0);
    }

    useLayoutEffect(() => {
      listRef.current?.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (items.length === 0) return false;
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="w-72 rounded-card border border-border bg-surface p-3 text-sm text-muted shadow-xl">
          Sin resultados
        </div>
      );
    }

    return (
      <div
        ref={listRef}
        className="max-h-80 w-72 overflow-y-auto rounded-card border border-border bg-surface p-1.5 shadow-xl"
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = index === selectedIndex;
          return (
            <button
              type="button"
              key={item.title}
              onClick={() => command(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left transition-colors ${
                active ? 'bg-surface-hover' : 'bg-transparent'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-background text-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                <span className="truncate text-xs text-muted">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';
