/**
 * Pie mínimo del shell: marca a la izquierda, copyright a la derecha.
 * Sin server actions ni estado, así que puede ser un Server Component.
 */
export function Footer() {
  return (
    <footer className="flex h-11 shrink-0 items-center justify-between border-t border-border px-4 text-xs text-muted md:px-6">
      <span>Blog Dashboard</span>
      <span>© {new Date().getFullYear()} · MIT</span>
    </footer>
  );
}
