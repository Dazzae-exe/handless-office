/** HTML "vacío" de Tiptap: solo párrafos sin texto (p. ej. `<p></p>`). */
const EMPTY_HTML_RE = /^(?:<p>(?:\s|<br\s*\/?>|&nbsp;)*<\/p>)*$/;

export function isEmptyHtml(html: string): boolean {
  return !html || EMPTY_HTML_RE.test(html.trim());
}
