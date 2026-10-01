/** Renders server-produced HTML (escaped text + KaTeX). Never pass user input here. */
export function Rich({ html, as: Tag = "span", className }: { html: string; as?: "span" | "div" | "p"; className?: string }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
