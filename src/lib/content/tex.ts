// Turns content text into safe HTML: plain text is escaped, $…$ is rendered by KaTeX,
// **…** becomes bold. Runs on the server only (the browser receives finished HTML).
import katex from "katex";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function inline(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

/** Throws on malformed TeX, so content tests catch mistakes before they reach a student. */
export function texToHtml(text: string): string {
  // A formula and the punctuation right after it stay on one line ("…$AC$, con…").
  const parts = text.split(/(\$[^$]+\$[,.;:!?)]?)/g);
  return parts
    .map((p) => {
      const m = /^\$([^$]+)\$([,.;:!?)]?)$/.exec(p);
      if (!m) return inline(p);
      const math = katex.renderToString(m[1], { throwOnError: true, strict: "ignore", output: "html" });
      return `<span class="whitespace-nowrap">${math}${escapeHtml(m[2])}</span>`;
    })
    .join("");
}
