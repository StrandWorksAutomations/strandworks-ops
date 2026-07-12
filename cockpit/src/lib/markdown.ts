// Repo markdown → HTML for the See views. Content is repo-authored (trusted
// tier), but we still escape raw HTML: marked is configured to treat inline
// HTML as text, so nothing in a report can inject markup or scripts.
import { marked } from "marked";

marked.use({
  renderer: {
    html({ text }: { text: string }) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
  },
});

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
