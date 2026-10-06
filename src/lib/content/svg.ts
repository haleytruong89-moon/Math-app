// LT7: inline SVG figures in content JSON. The SVG is rendered as raw markup, so it must pass a strict
// whitelist here (run by the schema, so `npm test` refuses a bad file). Pure module for `node --test`.

const TAGS = new Set(["svg", "g", "path", "line", "polyline", "polygon", "circle", "ellipse", "rect", "text", "tspan", "defs", "marker", "title"]);
const ATTRS = new Set([
  "xmlns", "viewBox", "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "dx", "dy",
  "d", "points", "transform", "id", "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin",
  "fill-opacity", "stroke-opacity", "opacity", "font-size", "font-weight", "font-style", "text-anchor", "dominant-baseline",
  "marker-start", "marker-mid", "marker-end", "markerWidth", "markerHeight", "refX", "refY", "orient", "markerUnits",
  "preserveAspectRatio", "role", "aria-label", "aria-hidden",
]);
const COLOR_ATTRS = new Set(["fill", "stroke"]);
const MARKER_ATTRS = new Set(["marker-start", "marker-mid", "marker-end"]);
const MAX_BYTES = 20 * 1024;

/** Theme-safe colour: follows the text colour or a design token, so light and dark both work. */
const themeColor = (v: string) => /^(none|currentColor|var\(--[a-z0-9-]+\))$/.test(v.trim());

/** Problems in Vietnamese; [] = safe to render. */
export function checkSvg(svg: string): string[] {
  const out: string[] = [];
  if (new TextEncoder().encode(svg).length > MAX_BYTES) out.push("hình SVG quá 20 KB");
  const s = svg.trim();
  if (!/^<svg[\s>]/.test(s) || !s.endsWith("</svg>")) out.push("hình phải là một thẻ <svg>…</svg>");
  if (/<[!?]/.test(s)) out.push("không dùng chú thích, DOCTYPE hay CDATA trong SVG");

  let depth = 0;
  let closedRoot = false;
  const tagRe = /<(\/?)([A-Za-z][\w:-]*)([^<>]*?)(\/?)>/g;
  let last = 0;
  for (let m: RegExpExecArray | null; (m = tagRe.exec(s)); ) {
    const between = s.slice(last, m.index);
    if (/[<>]/.test(between)) out.push("SVG có ký tự < hoặc > lạc chỗ");
    if (closedRoot && (between.trim() || m[0])) out.push("có nội dung sau thẻ </svg>");
    last = tagRe.lastIndex;
    const [, closing, tag, attrs, selfClose] = m;
    if (!TAGS.has(tag)) out.push(`thẻ <${tag}> không được phép`);
    if (closing) {
      depth--;
      if (depth === 0 && tag === "svg") closedRoot = true;
      continue;
    }
    if (depth === 0 && tag !== "svg") out.push("thẻ ngoài cùng phải là <svg>");
    if (depth === 0 && tag === "svg" && !/\sviewBox="[\d.\s-]+"/.test(attrs)) out.push("thẻ <svg> cần viewBox");
    if (!selfClose) depth++;

    const attrRe = /\s([A-Za-z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    const rest = attrs.replace(attrRe, "").trim();
    if (rest) out.push(`thuộc tính không đọc được trong <${tag}>: ${rest.slice(0, 30)}`);
    for (let a: RegExpExecArray | null; (a = attrRe.exec(attrs)); ) {
      const name = a[1];
      const value = a[3] ?? a[4] ?? "";
      if (!ATTRS.has(name)) {
        out.push(`thuộc tính ${name} không được phép trong <${tag}>`);
        continue;
      }
      if (COLOR_ATTRS.has(name) && !themeColor(value)) out.push(`màu ${name}="${value}": chỉ dùng currentColor, none hoặc var(--…)`);
      if (MARKER_ATTRS.has(name) && !/^url\(#[\w-]+\)$/.test(value)) out.push(`${name} chỉ trỏ tới marker trong hình (url(#id))`);
      if (!MARKER_ATTRS.has(name) && /url\(|javascript:|expression\(/i.test(value)) out.push(`giá trị ${name} không được chứa url(…)`);
    }
  }
  if (closedRoot && s.slice(last).trim()) out.push("có nội dung sau thẻ </svg>");
  if (depth !== 0) out.push("thẻ SVG đóng/mở không khớp");
  return [...new Set(out)];
}
