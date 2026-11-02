export function Footer() {
  return (
    <footer className="flex h-11 shrink-0 items-center justify-between border-t border-border px-4 text-xs text-muted md:px-6">
      <span>Blog Dashboard</span>
      <span>© {new Date().getFullYear()} · MIT</span>
    </footer>
  );
}
